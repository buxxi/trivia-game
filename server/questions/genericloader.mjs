import QuestionSelector from '../selector.mjs';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

class GenericCategoryLoader {
	constructor() {
	}

	create(path, input) {
		var parsed = JSON.parse(input);
		var description = parsed.description;
		description.type = /.*?([a-zA-Z0-9]+).json/.exec(path)[1];
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
		return new GenericCategory(path, description, questions, parsed.data);
	}
}

class GenericCategory {
	constructor(path, description, questions, data) {
		this._path = path;
		this._description = description;
		this._questions = questions;
		this._data = data;
	}

	describe() {
		return this._description;
	}

	async preload(progress) {
		progress(0, 2);

		if (typeof(this._data) == 'string') {
			let questionData = await fs.readFile(join(dirname(this._path), this._data));
			this._data = JSON.parse(questionData);
		}

		progress(1, 2);

		var selector = new QuestionSelector();
		var sanityCheck = [];
		for (var i = 0; i < 100; i++) {
			sanityCheck.push(this.nextQuestion(selector));
		}

		await Promise.all(sanityCheck);
		
		progress(2, 2);

		return this._countQuestions();
	}

	async nextQuestion(selector) {
		let question = new GenericQuestion(selector.fromWeightedObject(this._questions));
		let correct = question.correct(this._data, selector);

		try {
			return ({
				text : question.title(correct),
				answers : question.similar(correct, this._data, selector),
				correct : question.format(correct),
				view : question.attribution(correct)
			});
		} catch (e) {
			throw new Error("Failed loading question of type: '" + question.title({}) + "', reason: " + e);
		}
	}

	_countQuestions() {
		return Object.keys(this._questions).length * this._data.length;
	}
}

class GenericQuestion {
	constructor(model) {
		this._model = model;
	}

	title(correct) {
		return this._interpolate(this._model.question.format, {
			'correct' : correct
		});
	}

	correct(data, selector) {
		let pattern = this._model.answers.selector.correct;
		let fn = new Function("all", "selector", "return " + pattern);

		let correct = fn(data, selector, pattern);

		if (!correct) {
			throw new Error("No correct answer found");
		}

		return correct;
	}

	similar(correct, data, selector) {
		let pattern = this._model.answers.selector.alternatives;
		let sorted = this._model.answers.selector.sorted;

		let fn = new Function("all", "correct", "selector", "return " + pattern);

		return selector.alternatives(fn(data, correct, selector), correct, answer => this.format(answer), sorted ? (arr) => selector.first(arr) : (arr) => selector.splice(arr));
	}

	format(answer) {
		return this._interpolate(this._model.answers.format, {
			'answer' : answer
		});
	}

	attribution(obj) {
		return this._cloneAndInterpolate(obj, this._model.view);
	}

	_cloneAndInterpolate(data, source) {
		let self = this;
		let clone = JSON.parse(JSON.stringify(source));
		function interpolateRecursive(obj) {
			if (typeof obj === 'string') {
				return self._interpolate(obj, data);
			}
			for (let i in obj) {
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

export default GenericCategoryLoader;