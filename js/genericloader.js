function GenericCategoryLoader() {
	var self = this;

	self.create = function(name, input) {
		var parsed = JSON.parse(input);
		var description = parsed.description;
		description.type = /.*?([a-zA-Z0-9]+).json/.exec(name)[1];
		description.count = parsed.questions.length * parsed.data.length;
		description.static = true;
		if (!description.attribution) {
			description.attribution = [];
		}
		var questions = parsed.questions.reduce((map, obj) => { //Convert to a object so we can reuse the same selection mechanism by weight as regular categories
			map[Object.keys(map).length] = obj;
			if (!obj.weight) {
				obj.weight = 1;
			}
			return map;
		}, {});
		return new GenericCategory(description, questions, parsed.data);
	}
}

function GenericCategory(description, questions, data) {
	var self = this;

	self.describe = function() {
		return description;
	}

	self.preload = function(progress) {
		return new Promise((resolve, reject) => {
			var selector = new QuestionSelector();
			var sanityCheck = [];
			for (var i = 0; i < 100; i++) {
				sanityCheck.push(self.nextQuestion(selector));
			}

			Promise.all(sanityCheck).then(resolve).catch(reject);
		});
	}

	self.nextQuestion = function(selector) {
		var question = new GenericQuestion(selector.fromWeightedObject(questions));
		var correct = question.correct(data, selector);

		return new Promise((resolve, reject) => {
			try {
				resolve({
					text : question.title(correct),
					answers : question.similar(correct, data, selector),
					correct : question.format(correct),
					view : question.attribution(correct)
				});
			} catch (e) {
				reject("Failed loading question of type: '" + question.title({}) + "', reason: " + e);
			}
		});
	}
}

function GenericQuestion(model) {
	var self = this;

	self.title = function(correct) {
		return interpolate(model.question.format, {
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
		return interpolate(model.answers.format, {
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
				return interpolate(obj, data);
			}
			for (var i in obj) {
				obj[i] = interpolateRecursive(obj[i]);
			}
			return obj;
		}

		return interpolateRecursive(clone);
	}

	function interpolate(text, data) {
		text = text.replace(/{{[\s]*([^}\s]+)[\s]*}}/g, '${this.$1}'); //Replace {{ key1.key2 }} with ${this.key1.key2}
		let template = new Function("return `" + text + "`;");
		let result = template.call(data);
		return result;
	}
}
