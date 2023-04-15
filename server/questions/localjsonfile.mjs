import { promises as fs } from 'fs';
import QuestionSelector from '../selector.mjs';

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

    async nextQuestion() {
		let type = QuestionSelector.fromWeightedObject(this._types());

		let correct = type.correct(this._data, QuestionSelector);
		let similar = type.similar(correct, this._data, QuestionSelector);
		let title = type.title(correct);
		let view = type.load(correct);
		let format = (answer) => `${type.format(answer)}`;
		let sorted = !!type.sorted;
		let answerSelector = sorted ? QuestionSelector.first : QuestionSelector.splice;

		return ({
			text : title,
			answers : QuestionSelector.alternatives(similar, correct, format, answerSelector),
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