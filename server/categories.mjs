import Cache from './cache.mjs';
import QuestionSelector from './selector.mjs';

class Categories {
	constructor(config) {
		this._categories =  [];
		this._config = config;
		this._jokes = [];
	}

	async init() {
		this._categories = [];
		for (let category of this._config.categories) {
			let categoryModule = await import(`./questions/${category}.mjs`);
			this._categories.push(new categoryModule.default(this._config));
		}

		this._jokes = this._config.jokes;
	}

	available() {
		return this._categories.map((category) => category.describe());
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
		question.category = category.describe();
		
		return question;
	}

	clearCache() {
		Cache.clearAll();
	}

	_categoryByType(type) {
		for (var i = 0; i < this._categories.length; i++) {
			if (this._categories[i].describe().type == type) {
				return this._categories[i];
			}
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