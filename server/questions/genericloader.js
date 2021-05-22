const QuestionSelector = require('../selector.js');

class GenericCategoryLoader {
	constructor() {
	}

	create(name, input) {
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

class GenericCategory {
	constructor(description, questions, data) {
		this._description = description;
		this._questions = questions;
		this._data = data;
	}

	describe() {
		return this._description;
	}

	preload(progress) {
		return new Promise((resolve, reject) => {
			var selector = new QuestionSelector();
			var sanityCheck = [];
			for (var i = 0; i < 100; i++) {
				sanityCheck.push(this.nextQuestion(selector));
			}

			Promise.all(sanityCheck).then(resolve).catch(reject);
		});
	}

	nextQuestion(selector) {
		var question = new GenericQuestion(selector.fromWeightedObject(this._questions));
		var correct = question.correct(this._data, selector);

		return new Promise((resolve, reject) => {
			try {
				resolve({
					text : question.title(correct),
					answers : question.similar(correct, this._data, selector),
					correct : question.format(correct),
					view : question.attribution(correct)
				});
			} catch (e) {
				reject("Failed loading question of type: '" + question.title({}) + "', reason: " + e);
			}
		});
	}
}

class GenericQuestion {
	constructor(model) {
		this._model = model;
	}

	title(correct) {
		return _interpolate(this._model.question.format, {
			'correct' : correct
		});
	}

	correct(data, selector) {
		var pattern = this._model.answers.selector.correct;
		var fn = new Function("all", "selector", "return " + pattern);

		var correct = fn(data, selector, pattern);

		if (!correct) {
			throw new Error("No correct answer found");
		}

		return correct;
	}

	similar(correct, data, selector) {
		var pattern = this._model.answers.selector.alternatives;
		var sorted = this._model.answers.selector.sorted;

		var fn = new Function("all", "correct", "selector", "return " + pattern);

		return selector.alternatives(fn(data, correct, selector), correct, this.format, sorted ? selector.first : selector.splice);
	}

	format(answer) {
		return this._interpolate(this.model.answers.format, {
			'answer' : answer
		});
	}

	attribution(obj) {
		return this._cloneAndInterpolate(obj, this.model.view);
	}

	_cloneAndInterpolate(data, source) {
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

	_interpolate(text, data) {
		text = text.replace(/{{[\s]*([^}\s]+)[\s]*}}/g, '${this.$1}'); //Replace {{ key1.key2 }} with ${this.key1.key2}
		let template = new Function("return `" + text + "`;");
		let result = template.call(data);
		return result;
	}
}

module.exports = GenericCategoryLoader;