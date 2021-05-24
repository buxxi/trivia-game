const fs = require("fs").promises;

const MovieQuestions = require('./questions/movies.js');
const VideoGameQuestions = require('./questions/videogames.js');
const CurrentGameQuestions = require('./questions/meta.js');
const ActorQuestions = require('./questions/actors.js');
const DrinksQuestions = require('./questions/drinks.js');
const GeographyQuestions = require('./questions/geography.js');
const MusicQuestions = require('./questions/music.js');
const QuotesQuestions = require('./questions/quotes.js');
const GenericCategoryLoader = require('./questions/genericloader.js');
const Cache = require('./cache.js');
const QuestionSelector = require('./selector.js');

class Categories {
	constructor() {
		this._categories =  [];
		this._enabledCategories = [];
		this._apikeys = {};
		this._jokes = [];
		this._genericloader = new GenericCategoryLoader();
	}

	init() {
		return new Promise(async (resolve, reject) => {
			if (Object.keys(this._apikeys).length != 0) {
				return resolve();
			}
			try {
				let apiKeysData = await fs.readFile('conf/api-keys.json');
				Object.assign(this._apikeys, JSON.parse(apiKeysData));

				this._categories = [
					new ActorQuestions(this._apikeys.tmdb),
					new DrinksQuestions(),
					new GeographyQuestions(),
					new CurrentGameQuestions(),
					new MovieQuestions(this._apikeys.youtube, this._apikeys.tmdb),
					new MusicQuestions(this._apikeys.spotify, this._apikeys.spotifyWhiteList),
					new QuotesQuestions(this._apikeys.mashape),
					new VideoGameQuestions(this._apikeys.youtube, this._apikeys.igdb_client_id, this._apikeys.igdb_client_secret)
				]

				for (let path of this._apikeys.other) {
					let categoryData = await fs.readFile(path);
					var newCategory = this._genericloader.create(path, categoryData);
					this._categories.push(newCategory);
				}
				let jokesData = await fs.readFile('conf/jokes.json');
				this._jokes = JSON.parse(jokesData);

				resolve();
			} catch (e) {
				reject(e);
			}
		});
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

	countQuestions(input) {
		return Object.keys(input).filter((category) => input[category]).map((c) => this._categoryByType(c).describe().count).reduce((a, b) => a + b, 0);
	}

	attribution() {
		var attribution = this._categories.reduce((result, current) => result.concat(current.describe().attribution), []);
		var attributionMap = {};
		for (let attr of attribution) {
			attributionMap[attr.name] = attr;
		}
		return Object.values(attributionMap);
	}

	nextQuestion(session) {
		var selector = new QuestionSelector();
		var category = selector.fromWeightedObject(this._enabledCategories);

		Object.keys(this._enabledCategories).forEach((key) => {
			this._enabledCategories[key].weight = this._enabledCategories[key].weight * 2;
		});
		category.weight = 2;

		return category.nextQuestion(selector).then(this._shuffleAnswers).then(this._updateSession(category, session));
	}

	clearCache() {
		new Cache().clearAll();
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
		return new Promise((resolve, reject) => {
			var selector = new QuestionSelector();

			var answers = {
				A : selector.splice(question.answers),
				B : selector.splice(question.answers),
				C : selector.splice(question.answers),
				D : selector.splice(question.answers),
			};

			question.answers = answers;
			resolve(question);
		});
	}

	_updateSession(category, session) {
		return function(question) {
			return new Promise((resolve, reject) => {
				session.newQuestion(category, question);
				resolve(question);
			});
		};
	}
}

module.exports = Categories;
