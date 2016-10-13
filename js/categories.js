triviaApp.service('categories', function(movies, music, geography, quotes, videogames, drinks) {
	function Cache(primaryKey) {
		var self = this;

		self.get = function(subKey, promiseFunction) {
			return new Promise(function(resolve, reject) {
				var key = primaryKey + "-" + subKey;
				var result = localStorage.getItem(key);
				if (result) {
					resolve(JSON.parse(result));
				} else {
					promiseFunction(function(result) {
						localStorage.setItem(key, JSON.stringify(result));
						resolve(result);
					}, reject);
				}
			});
		}
	}

	function Random() {
		var self = this;

		self.fromArray = function(arr) {
			return arr[arr.length * Math.random() << 0];
		};

		self.splice = function(arr) {
			return arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
		};
	}

	function Categories() {
		var self = this;
		var categories = [movies, music, geography, quotes, videogames, drinks];
		var enabledCategories = [];

		self.available = function() {
			return categories.map(function(category) {
				return category.describe();
			});
		}

		self.preload = function(category, progress) {
			return categoryByType(category).preload(progress, new Cache(category));
		}

		self.configure = function(categories) {
			enabledCategories = Object.keys(categories).filter(function(category) {
				return categories[category];
			});
		}

		self.nextQuestion = function() {
			var random = new Random();
			return categoryByType(random.fromArray(enabledCategories)).nextQuestion(random).then(shuffleAnswers);
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
			return new Promise(function(resolve, reject) {
				var random = new Random();

				var answers = {
					A : random.splice(question.answers),
					B : random.splice(question.answers),
					C : random.splice(question.answers),
					D : random.splice(question.answers),
				};

				question.answers = answers;
				resolve(question);
			});
		}
	}

	return new Categories();
});
