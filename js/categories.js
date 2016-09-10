triviaApp.service('categories', function(movies, music) {
	function Categories() {
		var self = this;
		var categories = [movies, music];

		self.available = function() {
			return categories.map(function(category) {
				return category.describe();
			});
		}

		self.preload = function(category, progress) {
			return categoryByType(category).preload(progress);
		}

		self.randomQuestion = function(categories) {
			var enabledCategories = Object.keys(categories).filter(function(category) {
				return categories[category];
			});
			return categoryByType(randomFromArray(enabledCategories)).randomQuestion();
		}

		function randomFromArray(arr) { //TODO: copy from movies.js
			return arr[arr.length * Math.random() << 0];
		}

		function categoryByType(type) {
					for (var i = 0; i < categories.length; i++) {
				if (categories[i].describe().type == type) {
					return categories[i];
				}
			}
			throw new Error("No such category: " + type);
		}
	}

	return new Categories();
});
