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
		this._categories = [
			new ActorQuestions(),
			new DrinksQuestions(),
			new GeographyQuestions(),
			new CurrentGameQuestions(),
			new MovieQuestions(),
			new MusicQuestions(),
			new QuotesQuestions(),
			new VideoGameQuestions()	
		];
		this._enabledCategories = [];
		this._apikeys = {};
		this._jokes = [];
		this._genericloader = new GenericCategoryLoader();
	}

	init() {
		return new Promise((resolve, reject) => {
			if (Object.keys(apikeys).length != 0) {
				return resolve();
			}
			fetch('conf/api-keys.json').then(response => response.json()).then(data => {
				Object.assign(apikeys, data);
			}).then(() => {
				return Promise.all(apikeys.other.map((url) => self.loadFromURL(url))).then(resolve).catch(reject);
			}).catch(reject);
			fetch('conf/jokes.json').then(response => response.json()).then(data => {
				jokes = data;
			});
		});
	}

	available() {
		return categories.map((category) => category.describe());
	}

	enabled() {
		return self.available().filter((category) => !!enabledCategories[category.type]);
	}

	joke() {
		var selector = new QuestionSelector();
		return selector.fromArray(jokes);
	}

	preload(category, progress, game) {
		return categoryByType(category).preload(progress, new Cache(category), apikeys, game);
	}

	configure(input) {
		enabledCategories = Object.keys(input).filter((category) => input[category]).reduce((obj, value) => {
			var c = categoryByType(value);
			obj[value] = {
				weight : 2,
				nextQuestion : (selector) => c.nextQuestion(selector),
				name : c.describe().name
			};

			return obj;
		}, {});
	}

	countQuestions(input) {
		return Object.keys(input).filter((category) => input[category]).map((c) => categoryByType(c).describe().count).reduce((a, b) => a + b, 0);
	}

	attribution() {
		var attribution = categories.reduce((result, current) => result.concat(current.describe().attribution), []);
		var attributionMap = {};
		for (let attr of attribution) {
			attributionMap[attr.name] = attr;
		}
		return Object.values(attributionMap);
	}

	nextQuestion(session) {
		var selector = new QuestionSelector();
		var category = selector.fromWeightedObject(enabledCategories);

		Object.keys(enabledCategories).forEach((key) => {
			enabledCategories[key].weight = enabledCategories[key].weight * 2;
		});
		category.weight = 2;

		return category.nextQuestion(selector).then(shuffleAnswers).then(updateSession(category, session));
	}

	loadFromURL(url) {
		return new Promise((resolve, reject) => {
			fetch(url).then(response => response.json()).then(data => {
				var newCategory = genericloader.create(url, JSON.stringify(data));
				categories.push(newCategory);
				resolve(newCategory.describe().type);
			}).catch(reject);
		});
	}

	loadFromFile(file) {
		return new Promise((resolve, reject) => {
			var reader = new FileReader(file);
			reader.onload = (e) => {
				var newCategory = genericloader.create(file.name, reader.result);
				categories.push(newCategory);
				resolve(newCategory.describe().type);
			};

			reader.readAsText(file, "UTF-8");
		});
	}

	clearCache() {
		new Cache().clearAll();
	}

	categoryByType(type) {
			for (var i = 0; i < categories.length; i++) {
			if (categories[i].describe().type == type) {
				return categories[i];
			}
		}
		throw new Error("No such category: " + type);
	}

	shuffleAnswers(question) {
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

	updateSession(category, session) {
		return function(question) {
			return new Promise((resolve, reject) => {
				session.newQuestion(category, question);
				resolve(question);
			});
		};
	}
}

module.exports = Categories;