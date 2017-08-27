function GenericCategoryLoader($interpolate, $parse) {
	var self = this;

	self.create = function(name, input) {
		var parsed = JSON.parse(input);
		var description = parsed.description;
		description.type = /.*?([a-zA-Z0-9]+).json/.exec(name)[1];
		description.count = parsed.questions.length * parsed.data.length;
		description.static = true;
		return new GenericCategory($interpolate, $parse, description, parsed.questions, parsed.data);
	}
}

function GenericCategory($interpolate, $parse, description, questions, data) {
	var self = this;

	self.describe = function() {
		return description;
	}

	self.preload = function(progress) {
		return new Promise((resolve, reject) => {
			resolve(); //TODO: verify structure maybe?
		});
	}

	self.nextQuestion = function(selector) {
		var question = new GenericQuestion($interpolate, $parse, questions, selector.fromArray(questions));
		var correct = question.correct(data, selector);

		return new Promise((resolve, reject) => {
			resolve({
				text : question.title(correct),
				answers : question.similar(correct, data, selector),
				correct : question.format(correct),
				view : question.attribution(correct)
			});
		});
	}
}

function GenericQuestion($interpolate, $parse, questions, model) {
	var self = this;

	self.title = function(correct) {
		return $interpolate(model.question.format)({
			'correct' : correct
		});
	}

	self.correct = function(data, selector) {
		var pattern = model.answers.selector.correct;
		var fn = new Function("all", "selector", "return " + pattern);

		var correct = fn(data, selector, pattern);

		if (!correct) {
			throw new Error("No correct answer found");
		}

		return correct;
	}

	self.similar = function(correct, data, selector) {
		var pattern = model.answers.selector.alternatives;
		var sorted = model.answers.selector.sorted;

		var fn = new Function("all", "correct", "selector", "return " + pattern);

		return selector.alternatives(fn(data, correct, selector), correct, self.format, sorted ? selector.first : selector.splice);
	}

	self.format = function(answer) {
		return $interpolate(model.answers.format)({
			'answer' : answer
		});
	}

	self.attribution = function(obj) {
		return cloneAndInterpolate(obj, model.view);
	}

	function cloneAndInterpolate(data, source) {
		var clone = JSON.parse(JSON.stringify(source));
		function interpolateRecursive(obj) {
			if (typeof obj === 'string') {
				return $interpolate(obj)(data);
			}
			for (var i in obj) {
				obj[i] = interpolateRecursive(obj[i]);
			}
			return obj;
		}

		return interpolateRecursive(clone);
	}
}
