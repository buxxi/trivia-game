const dbPromise = idb.open('keyval-store', 1, upgradeDB => {
	upgradeDB.createObjectStore('keyval');
});

const idbKeyval = {
	get(key) {
		return dbPromise.then(db => {
			return db.transaction('keyval').objectStore('keyval').get(key);
		});
	},
	set(key, val) {
		return dbPromise.then(db => {
			const tx = db.transaction('keyval', 'readwrite');
			tx.objectStore('keyval').put(val, key);
			return tx.complete;
		});
	}
}

function Cache(primaryKey) {
	var self = this;

	self.get = function(subKey, promiseFunction) {
		return new Promise((resolve, reject) => {
			var key = primaryKey + "-" + subKey;

			idbKeyval.get(key).then((val) => {
				if (!val) {
					promiseFunction((result) => {
						idbKeyval.set(key, result).then(() => resolve(result)).catch(reject);
					}, reject);
				} else {
					resolve(val);
				}
			}).catch(reject);
		});
	}
}

function QuestionSelector() {
	var self = this;

	self.random = function(max) {
		return max * Math.random() << 0;
	}

	self.fromArray = function(arr, filter) {
		if (filter != undefined) {
			arr = arr.filter(filter);
		}
		return arr[self.random(arr.length)];
	};

	self.fromWeightedObject = function(obj) {
		var keys = Object.keys(obj);
		var total = keys.map((k) => obj[k].weight).reduce((a, b) => a + b, 0);
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
		if (arr.length == 0) {
			throw new Error("Trying to splice empty array");
		}
		return arr.splice(self.random(arr.length), 1)[0];
	};

	self.first = function(arr) {
		if (arr.length == 0) {
			throw new Error("Trying to get first element of empty array");
		}
		return arr.shift();
	}

	self.alternatives = function(list, correct, toString, picker) {
		var list = list.slice();
		var result = [toString(correct)];
		while (result.length < 4) {
			if (list.length == 0) {
				return result;
			}
			var e = toString(picker(list));
			if (e == "") {
				throw new Error("Empty alternative returned");
			}

			if (result.indexOf(e) == -1) {
				result.push(e);
			}
		}
		return result;
	}

	self.prioritizeAlternatives = function() {
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i].length >= 3) {
				return arguments[i];
			}
		}
		throw new Error("None of the lists provided has enough alternatives");
	}

	self.sortCompareCorrect = function(arr, compare, correct, mapping) {
		if (mapping == undefined) {
			mapping = (i) => i;
		}
		return arr.sort((a, b) => {
			return compare(mapping(b), mapping(correct)) - compare(mapping(a), mapping(correct));
		});
	}

	self.hasAllCommon = function(arr1, arr2) {
		return self.countCommon(arr1, arr2) == arr2.length;
	}

	self.hasNoneCommon = function(arr1, arr2) {
		return self.countCommon(arr1, arr2) == 0;
	}

	self.countCommon = function(arr1, arr2) {
		if (!arr1 || !arr2) {
			return 0;
		}

		return arr1.reduce((acc, cur) => {
			if (arr2.indexOf(cur) > -1) {
				return acc + 1;
			} else {
				return acc;
			}
		}, 0);
	}

	self.wordsFromString = function(s) {
		return s.split(/[^a-zA-Z0-9]/).filter((s) => s.length > 0).map((s) => s.toLowerCase());
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

function Categories(movies, music, geography, quotes, videogames, drinks, genericloader, $http) {
	var self = this;
	var categories = [movies, music, geography, quotes, videogames, drinks];
	var enabledCategories = [];
	var apikeys = {};
	var jokes = [];

	self.init = function() {
		return new Promise((resolve, reject) => {
			if (Object.keys(apikeys).length != 0) {
				return resolve();
			}
			$http.get('conf/api-keys.json').then((response) => {
				Object.assign(apikeys, response.data);
			}).then(() => {
				return Promise.all(apikeys.other.map((url) => self.loadFromURL(url))).then(resolve).catch(reject);
			}).catch(reject);
			$http.get('conf/jokes.json').then((response) => {
				jokes = response.data;
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

	self.preload = function(category, progress) {
		return categoryByType(category).preload(progress, new Cache(category), apikeys);
	}

	self.configure = function(input) {
		enabledCategories = Object.keys(input).filter((category) => input[category]).reduce((obj, value) => {
			var c = categoryByType(value);
			obj[value] = {
				weight : 2,
				nextQuestion : c.nextQuestion,
				name : c.describe().name
			};

			return obj;
		}, {});
	}

	self.countQuestions = function(input) {
		return Object.keys(input).filter((category) => input[category]).map((c) => categoryByType(c).describe().count).reduce((a, b) => a + b, 0);
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
			$http.get(url).then((response) => {
				var newCategory = genericloader.create(url, JSON.stringify(response.data));
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
