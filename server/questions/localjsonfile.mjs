import { promises as fs } from 'fs';
import Questions from './questions.mjs';
import {customDataPath} from "../xdg.mjs";

class LocalJsonFileQuestions extends Questions {
	constructor(config, categoryName) {
		super(config, categoryName);
        this._path = customDataPath(config.dataPath[categoryName]);
        this._data = [];
		this._clone = () => new this.constructor(config, categoryName);
    }

	async preload(language, progress, cache) {
		progress(0, 1);

		let languageQuestions = await this._loadLanguageQuestions(language);
		this._data = this._data.filter((item) => item.language !== language);
		this._data.push({language: language, category: languageQuestions});
		this.nextQuestion = async (game) => {
			return this._data.find(item => item.language === game.language()).category.nextQuestion(game);
		};

		progress(1, 1);
		return this._data.find(e => e.language === language).category._countQuestions();
	}

	async _loadLanguageQuestions(language) {
		let rawData = await fs.readFile(this._path.replace("{language}", language));
		let languageQuestions = this._clone();
		languageQuestions._data = JSON.parse(rawData);
		return languageQuestions;
	}

	_countQuestions() {
		return this._data.length * Object.keys(this._types).length;
	}
}

export default LocalJsonFileQuestions;