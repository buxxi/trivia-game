triviaApp.service('categories', function(movies, music, geography) {
	function Categories() {
		var self = this;
		var categories = [movies, music, geography];
		var random = {
			fromArray : function(arr) {
				return arr[arr.length * Math.random() << 0];
			},

			splice : function (arr) {
				return arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
			}
		};

		self.available = function() {
			return categories.map(function(category) {
				return category.describe();
			});
		}

		self.preload = function(category, progress) {
			return categoryByType(category).preload(progress);
		}

		self.nextQuestion = function(categories) {
			var enabledCategories = Object.keys(categories).filter(function(category) {
				return categories[category];
			});
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
