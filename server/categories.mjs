import Cache from './cache.mjs';
import Random from './random.mjs';
import { register } from 'node:module';
import {customQuestionPath} from "./xdg.mjs";
import Translator from "./translation.mjs";

class Categories {
	constructor(config) {
		this._categories = {};
		this._config = config;
		this._jokes = [];
	}

	async init() {
		register('./custom-question-loader.mjs', import.meta.url);
		this._categories = {};
		for (let category of this._config.categories) {
			let categoryModule = await Promise.any([import(`./questions/${category}.mjs`), this._readCustomCategory(category)]);
			this._categories[category] = new categoryModule.default(this._config, category);
		}

		this._jokes = this._config.jokes;
	}

	available(game) {
		let translator = new Translator(game.language());
		return Object.entries(this._categories).map(([key, category]) => Object.assign({ type: key}, translator.translateObject(category.describe())));
	}

	enabled(game) {
		return this.available(game).filter((category) => game.categoryEnabled(category.type));
	}

	joke(game) {
		let player = Random.fromWeightedObject(game.players()) ?? {name : ""};
		let joke = Random.fromArray(this._jokes);
		return {
			icon: joke.icon,
			name: new Translator(game.language()).translateObject(joke.name.replace("{playerName}", player.name))
		};
	}

	preload(category, game, progress) {
		return this._categoryByType(category).preload(game.language(), progress, new Cache(category));
	}

	async nextQuestion(game, weightedCategories) {
		let selected = Random.fromWeightedObject(weightedCategories);
		let categoryName = Object.entries(weightedCategories).find(([key, value]) => value == selected)[0];
		let category = this._categoryByType(categoryName);

		let question = await category.nextQuestion(game);
		if (!question.correct) {
			throw new Error("Got empty correct answer for " + question.text);
		}
		if (question.answers.filter(a => !!a).length < 4) {
			throw new Error("Got to few answers for " + question.text + " (" + question.answers + ")");
		}
		if (!question.answers.includes(question.correct)) {
			throw new Error("The correct answer wasn't part of the possible answers for " + question.text);
		}

		this._shuffleAnswers(question);
		question.category = Object.assign({type: categoryName}, category.describe());
		
		return question;
	}

	clearCache(category) {
		new Cache(category).clear();	
	}

	_categoryByType(type) {
		if (type in this._categories) {
			return this._categories[type];
		}

		throw new Error("No such category: " + type);
	}

	_shuffleAnswers(question) {
		let answers = {
			A : this._splice(question.answers),
			B : this._splice(question.answers),
			C : this._splice(question.answers),
			D : this._splice(question.answers),
		};

		question.answers = answers;
		return question;
	}

	_splice(arr) {
		if (arr.length == 0) {
			throw new Error("Trying to splice empty array");
		}
		return arr.splice(Random.random(arr.length), 1)[0];
	}

	async _readCustomCategory(category) {
		return import(customQuestionPath(`${category}.mjs`));
	}
}

export default Categories;