import { promises as fs } from 'fs';
import MovieQuestions from './questions/movies.mjs';
import VideoGameQuestions from './questions/videogames.mjs';
import CurrentGameQuestions from './questions/meta.mjs';
import ActorQuestions from './questions/actors.mjs';
import DrinksQuestions from './questions/drinks.mjs';
import GeographyQuestions from './questions/geography.mjs';
import MusicQuestions from './questions/music.mjs';
import QuotesQuestions from './questions/quotes.mjs';
import MathQuestions from './questions/math.mjs';
import UnitQuestions from './questions/units.mjs';
import GenericCategoryLoader from './questions/genericloader.mjs';
import Cache from './cache.mjs';
import QuestionSelector from './selector.mjs';

class Categories {
	constructor(config) {
		this._categories =  [];
		this._config = config;
		this._jokes = [];
		this._genericloader = new GenericCategoryLoader();
	}

	async init() {
		this._categories = [
			new ActorQuestions(this._config.tmdb.clientId),
			new DrinksQuestions(),
			new GeographyQuestions(),
			new CurrentGameQuestions(),
			new MovieQuestions(this._config.youtube.clientId, this._config.youtube.region, this._config.tmdb.clientId),
			new MusicQuestions(this._config.spotify.clientId, this._config.spotify.clientSecret, this._config.spotify.whiteList),
			new QuotesQuestions(),
			new VideoGameQuestions(this._config.youtube.clientId, this._config.youtube.region, this._config.igdb.clientId, this._config.igdb.clientSecret),
			new MathQuestions(),
			new UnitQuestions()
		]

		for (let path of this._config.staticCategories) {
			let categoryData = await fs.readFile(path);
			var newCategory = this._genericloader.create(path, categoryData);
			this._categories.push(newCategory);
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

	preload(category, progress, game) {
		return this._categoryByType(category).preload(progress, new Cache(category), game);
	}

	async nextQuestion(game, weightedCategories) {
		let selector = new QuestionSelector();

		let selected = selector.fromWeightedObject(weightedCategories);
		let categoryName = Object.entries(weightedCategories).find(([key, value]) => value == selected)[0];
		let category = this._categoryByType(categoryName);

		let question = await category.nextQuestion(selector);
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