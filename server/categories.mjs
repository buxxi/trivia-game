import { promises as fs } from 'fs';
import MovieQuestions from './questions/movies.mjs';
import VideoGameQuestions from './questions/videogames.mjs';
import CurrentGameQuestions from './questions/meta.mjs';
import ActorQuestions from './questions/actors.mjs';
import DrinksQuestions from './questions/drinks.mjs';
import GeographyQuestions from './questions/geography.mjs';
import MusicQuestions from './questions/music.mjs';
import QuotesQuestions from './questions/quotes.mjs';
import GenericCategoryLoader from './questions/genericloader.mjs';
import Cache from './cache.mjs';
import QuestionSelector from './selector.mjs';

class Categories {
	constructor(config) {
		this._categories =  [];
		this._enabledCategories = [];
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
			new MovieQuestions(this._config.youtube.clientId, this._config.tmdb.clientId),
			new MusicQuestions(this._config.spotify.clientId, this._config.spotify.clientSecret, this._config.spotify.whiteList),
			new QuotesQuestions(this._config.mashape.clientId),
			new VideoGameQuestions(this._config.youtube.clientId, this._config.igdb.clientId, this._config.igdb.clientSecret)
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

	enabled() {
		return this.available().filter((category) => !!this._enabledCategories[category.type]);
	}

	joke() {
		var selector = new QuestionSelector();
		return selector.fromArray(this._jokes);
	}

	preload(category, progress, game) {
		return this._categoryByType(category).preload(progress, new Cache(category), game);
	}

	configure(input) {
		this._enabledCategories = Object.keys(input).filter((category) => input[category]).reduce((obj, value) => {
			var c = this._categoryByType(value);
			obj[value] = {
				weight : 2,
				nextQuestion : (selector) => c.nextQuestion(selector),
				name : c.describe().name
			};

			return obj;
		}, {});
	}

	nextQuestion(session) {
		let selector = new QuestionSelector();
		let category = selector.fromWeightedObject(this._enabledCategories);

		Object.keys(this._enabledCategories).forEach((key) => {
			this._enabledCategories[key].weight = this._enabledCategories[key].weight * 2;
		});
		category.weight = 2;

		return category.nextQuestion(selector).then(this._shuffleAnswers).then(this._updateSession(category, session));
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

	async _shuffleAnswers(question) {
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

	_updateSession(category, session) {
		return async function(question) {
			session.newQuestion(category, question);
			return question;
		};
	}
}

export default Categories;	