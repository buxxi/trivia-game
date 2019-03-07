import MovieQuestions from './questions/movies.js';
import VideoGameQuestions from './questions/videogames.js';
import CurrentGameQuestions from './questions/meta.js';
import ActorQuestions from './questions/actors.js';
import DrinksQuestions from './questions/drinks.js';
import GeographyQuestions from './questions/geography.js';
import MusicQuestions from './questions/music.js';
import QuotesQuestions from './questions/quotes.js';
import GenericCategoryLoader from './questions/genericloader.js';
import Cache from './cache.js';
import QuestionSelector from './selector.js';

export default function Categories() {
	var self = this;

	var categories = [
		new MovieQuestions(),
		new MusicQuestions(),
		new GeographyQuestions(),
		new QuotesQuestions(),
		new VideoGameQuestions(),
		new DrinksQuestions(),
		new ActorQuestions(),
		new CurrentGameQuestions()
	];
	var enabledCategories = [];
	var apikeys = {};
	var jokes = [];
	var genericloader = new GenericCategoryLoader();

	self.init = function() {
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

	self.available = function() {
		return categories.map((category) => category.describe());
	}

	self.enabled = function() {
		return self.available().filter((category) => !!enabledCategories[category.type]);
	}

	self.joke = function() {
		var selector = new QuestionSelector();
		return selector.fromArray(jokes);
	}

	self.preload = function(category, progress, game) {
		return categoryByType(category).preload(progress, new Cache(category), apikeys, game);
	}

	self.configure = function(input) {
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

	self.countQuestions = function(input) {
		return Object.keys(input).filter((category) => input[category]).map((c) => categoryByType(c).describe().count).reduce((a, b) => a + b, 0);
	}

	self.attribution = function() {
		var attribution = categories.reduce((result, current) => result.concat(current.describe().attribution), []);
		var attributionMap = {};
		for (attr of attribution) {
			attributionMap[attr.name] = attr;
		}
		return Object.values(attributionMap);
	}

	self.nextQuestion = function() {
		var selector = new QuestionSelector();
		var category = selector.fromWeightedObject(enabledCategories);

		Object.keys(enabledCategories).forEach((key) => {
			enabledCategories[key].weight = enabledCategories[key].weight * 2;
		});
		category.weight = 2;

		return category.nextQuestion(selector).then(shuffleAnswers).then(attachCategory(category));
	}

	self.loadFromURL = function(url) {
		return new Promise((resolve, reject) => {
			fetch(url).then(response => response.json()).then(data => {
				var newCategory = genericloader.create(url, JSON.stringify(data));
				categories.push(newCategory);
				resolve(newCategory.describe().type);
			}).catch(reject);
		});
	}

	self.loadFromFile = function(file) {
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

	self.clearCache = function() {
		new Cache().clearAll();
	}

	function categoryByType(type) {
			for (var i = 0; i < categories.length; i++) {
			if (categories[i].describe().type == type) {
				return categories[i];
			}
		}
		throw new Error("No such category: " + type);
	}

	function shuffleAnswers(question) {
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

	function attachCategory(category) {
		return function(question) {
			return new Promise((resolve, reject) => {
				if (question.view.category) {
					question.view.category = [category.name, question.view.category];
				} else {
					question.view.category = [category.name];
				}
				resolve(question);
			});
		};
	}
}
