import { promises as fs } from 'fs';
import Questions from './questions.mjs';
import {customDataPath} from "../xdg.mjs";

class LocalJsonFileQuestions extends Questions {
    constructor(config, categoryName) {
		super();
        this._path = customDataPath(config.dataPath[categoryName]);
        this._data = [];
    }

	async preload(progress, cache) {
		progress(0, 1);
		this._data = JSON.parse(await fs.readFile(this._path));
		progress(1, 1);
		return this._countQuestions();
	}

	_countQuestions() {
		return this._data.length * Object.keys(this._types).length;
	}
}

export default LocalJsonFileQuestions;