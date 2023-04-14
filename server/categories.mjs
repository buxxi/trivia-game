import Cache from './cache.mjs';
import QuestionSelector from './selector.mjs';

class Categories {
	constructor(config) {
		this._categories = {};
		this._config = config;
		this._jokes = [];
	}

	async init() {
		this._categories = {};
		for (let category of this._config.categories) {
			let categoryModule = await Promise.any([import(`./questions/${category}.mjs`), import(`./questions/custom/${category}.mjs`)]);
			this._categories[category] = new categoryModule.default(this._config, category);
		}

		this._jokes = this._config.jokes;
	}

	available() {
		return Object.entries(this._categories).map(([key, category]) => Object.assign({ type: key}, category.describe()));
	}

	enabled(game) {
		return this.available().filter((category) => game.categoryEnabled(category.type));
	}

	joke() {
		var selector = new QuestionSelector();
		return selector.fromArray(this._jokes);
	}

	preload(category, progress) {
		return this._categoryByType(category).preload(progress, new Cache(category));
	}

	async nextQuestion(game, weightedCategories) {
		let selector = new QuestionSelector();

		let selected = selector.fromWeightedObject(weightedCategories);
		let categoryName = Object.entries(weightedCategories).find(([key, value]) => value == selected)[0];
		let category = this._categoryByType(categoryName);

		let question = await category.nextQuestion(selector, game);
		if (!question.correct) {
			throw new Error("Got empty correct answer for " + question.text);
		}
		if (question.answers.filter(a => !!a).length < 4) {
			throw new Error("Got to few answers for " + question.text + " (" + question.answers + ")");
		}

		this._shuffleAnswers(question);
		question.category = Object.assign({type: categoryName}, category.describe());
		
		return question;
	}

	clearCache() {
		Cache.clearAll();
	}

	_categoryByType(type) {
		if (type in this._categories) {
			return this._categories[type];
		}

		throw new Error("No such category: " + type);
	}

	_shuffleAnswers(question) {
		let selector = new QuestionSelector();

		let answers = {
			A : selector.splice(question.answers),
			B : selector.splice(question.answers),
			C : selector.splice(question.answers),
			D : selector.splice(question.answers),
		};

		question.answers = answers;
		return question;
	}
}

export default Categories;	