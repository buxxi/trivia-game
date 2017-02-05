triviaApp.service('categories', function(movies, music, geography, quotes, videogames, drinks, genericloader) {
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

	function QuestionSelector() {
		var self = this;

		self.random = function(max) {
			return max * Math.random() << 0;
		}

		self.fromArray = function(arr) {
			return arr[self.random(arr.length)];
		};

		self.fromWeightedObject = function(obj) {
			var keys = Object.keys(obj);
			var total = keys.map(function(k) { return obj[k].weight }).reduce(function(a, b) {
				return a + b;
			}, 0);
			var randomWeight = self.random(total);

			var index = 0;
			while (randomWeight > 0) {
				randomWeight -= obj[keys[index]].weight;
				index++;
			}
			if (randomWeight < 0) {
				index--;
			}

			return obj[keys[index]];
		}

		self.splice = function(arr) {
			return arr.splice(self.random(arr.length), 1)[0];
		};

		self.first = function(arr) {
			return arr.shift();
		}

		self.alternatives = function(list, correct, toString, picker) {
			var list = list.slice();
			var result = [toString(correct)];
			while (result.length < 4) {
				var e = toString(picker(list));
				if (result.indexOf(e) == -1) {
					result.push(e);
				}
			}
			return result;
		}

		self.countCommon = function(arr1, arr2) {
			return arr1.reduce(function(acc, cur) {
				if (arr2.indexOf(cur) > -1) {
					return acc + 1;
				} else {
					return acc;
				}
			}, 0);
		}

		self.wordsFromString = function(s) {
			return s.split(/[^a-zA-Z0-9]/).filter(function(s) { return s.length > 0 }).map(function(s) { return s.toLowerCase(); });
		}

		self.dateDistance = function(a, b) {
			var dist = Math.abs(new Date(Date.parse(a)).getFullYear() - new Date(Date.parse(b)).getFullYear());
			return Math.floor(Math.log(Math.max(dist, 1)));
		}

		self.levenshteinDistance = function(a, b) { //copied from and modified to use array instead: https://gist.github.com/andrei-m/982927
			if(a.length == 0 || b.length == 0) {
				return (a || b).length;
			}
			var m = [];
			for(var i = 0; i <= b.length; i++){
				m[i] = [i];
				if(i === 0) {
					continue;
				}
				for(var j = 0; j <= a.length; j++){
					m[0][j] = j;
					if(j === 0) {
						continue;
					}
					m[i][j] = b[i - 1] == a[j - 1] ? m[i - 1][j - 1] : Math.min(
						m[i-1][j-1] + 1,
						m[i][j-1] + 1,
						m[i-1][j] + 1
					);
				}
			}
			return m[b.length][a.length];
		}

		self.yearAlternatives = function(year, maxJump) {
			var min = year;
			var max = min;
			var result = [];
			while (result.length < 3) {
				var diff = Math.floor(Math.random() * ((maxJump * 2) + 1)) - maxJump;
				if (diff < 0) {
					min = min + diff;
					result.unshift(min);
				} else if (diff > 0 && max < new Date().getFullYear()) {
					max = max + diff;
					result.push(max);
				}
			}
			return result;
		}
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

		self.configure = function(input) {
			enabledCategories = Object.keys(input).filter(function(category) {
				return input[category];
			}).reduce(function(obj, value) {
				obj[value] = {
					weight : 1,
					nextQuestion : categoryByType(value).nextQuestion
				};

				return obj;
			}, {});
		}

		self.nextQuestion = function() {
			var selector = new QuestionSelector();
			var category = selector.fromWeightedObject(enabledCategories);

			Object.keys(enabledCategories).forEach(function(key) {
				enabledCategories[key].weight++;
			});
			category.weight = 1;

			console.log(enabledCategories);

			return category.nextQuestion(selector).then(shuffleAnswers);
		}

		self.load = function(file) {
			return new Promise(function(resolve, reject) {
				var reader = new FileReader(file);
				reader.onload = function(e) {
					var newCategory = genericloader.create(file.name, reader.result);
					categories.push(newCategory);
					resolve(newCategory.describe().type);
				};

				reader.readAsText(file, "UTF-8");
			});
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
	}

	return new Categories();
});
