function GenericCategoryLoader($interpolate, $parse) {
	var self = this;

	self.create = function(name, input) {
		var parsed = JSON.parse(input);
		var description = parsed.description;
		description.type = /.*?([a-zA-Z0-9]+).json/.exec(name)[1];
		description.count = parsed.questions.length * parsed.data.length;
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
		var q = new GenericQuestion($interpolate, $parse, questions, selector.fromArray(questions));
		var d = selector.fromArray(data);

		return new Promise((resolve, reject) => {
			resolve({
				text : q.title(d),
				answers : q.similar(d, data, selector),
				correct : q.format(q.correct(d)),
				view : q.attribution(d)
			});
		});
	}
}

function GenericQuestion($interpolate, $parse, questions, model) {
	var self = this;

	self.title = function(correct) {
		return $interpolate(model.question.format)({
			'question' : correct
		});
	}

	self.correct = function(obj) {
		var pattern = model.answers.selector.correct;
		var path = /{{(.*)}}/.exec(pattern);
		if (!path) {
			throw new Error("model.answers.selector.correct is in incorrect format");
		}

		return $parse(path[1].trim())({
			'question' : obj,
			'all' : questions
		});
	}

	self.similar = function(obj, questions, selector) {
		var pattern = model.answers.selector.alternatives;
		var path = /{{(.*)}}/.exec(pattern);
		if (!path) {
			throw new Error("model.answers.selector.alternatives is in incorrect format");
		}

		var answers = $parse(path[1].trim())({
			'question' : obj,
			'all' : questions,
			'$allOf' : (list) => list,
			'$randomOf' : (list) => selector.fromArray(list),
			'$randomOfExclude' : function(list, exclude) {
				console.log("list:" + list);
				console.log("exclude:" + exclude);
			}
		});
		/*if (answers.length < 4) {
			throw new Error("Expected answers to be an array of size 4 or larger");
		}*/

		return answers;
		//return selector.alternatives(answers, self.correct(obj), self.format, selector.first);
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
