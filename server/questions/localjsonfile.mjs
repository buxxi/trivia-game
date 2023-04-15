import { promises as fs } from 'fs';

class LocalJsonFileQuestions {
    constructor(config, categoryName) {
        this._path = config.dataPath[categoryName];
        this._data = [];
    }

	async preload(progress, cache) {
		progress(0, 1);
		this._data = JSON.parse(await fs.readFile(this._path));
		progress(1, 1);
		return this._countQuestions();
	}

    async nextQuestion(selector) {
		let type = selector.fromWeightedObject(this._types());

		let correct = type.correct(this._data, selector);
		let similar = type.similar(correct, this._data, selector);
		let title = type.title(correct);
		let view = type.load(correct);
		let format = (answer) => `${type.format(answer)}`;
		let sorted = !!type.sorted;
		let answerSelector = sorted ? (arr) => selector.first(arr) : (arr) => selector.splice(arr);

		return ({
			text : title,
			answers : selector.alternatives(similar, correct, format, answerSelector),
			correct : format(correct),
			view : view
		});
	}

    _countQuestions() {
		return this._data.length * Object.keys(this._types()).length;
	}

    describe() {
        throw new Error("Needs to be implemented by child class");
    }

    _types() {
        throw new Error("Needs to be implemented by child class");
    }
}

export default LocalJsonFileQuestions;