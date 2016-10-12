triviaApp.service('drinks', function($http, apikeys) {
	function DrinksQuestions() {
		var self = this;
		var drinks = [];
		var TOTAL_DRINKS = 50;

		self.describe = function() {
			return {
				type : 'drinks',
				name : 'Drinks',
				icon : 'fa-glass'
			};
		}

		self.preload = function(progress) {
			return new Promise(function(resolve, reject) {
				var result = localStorage.getItem('cocktaildb');
				if (result) {
					drinks = JSON.parse(result);
					resolve();
					return;
				}

				function parseDrink(response) {
					var data = response.data.drinks[0];
					var drink = {
						name : data['strDrink'],
						ingredients : Object.keys(data).filter(function(k) { return k.indexOf("strIngredient") > -1; }).map(function(k) { return data[k]; }).filter(function(v) { return !!v; }),
						image : data['strDrinkThumb']
					}
					drinks.push(drink);
				}

				progress(0, TOTAL_DRINKS);

				var promises = [];
				for (var i = 0; i < TOTAL_DRINKS; i++) {
					promises.push(loadRandomDrink());
				}
				for (var i = 0; i < (promises.length - 1); i++) {
					promises[i].then(function(response) {
						parseDrink(response);
						progress(drinks.length, TOTAL_DRINKS);
						return promises[i + 1];
					});
				}
				promises[promises.length - 1].then(function(response) {
					parseDrink(response);
					localStorage.setItem('cocktaildb', JSON.stringify(drinks));
					resolve();
				});
			});
		}


		self.nextQuestion = function(random) {
			return new Promise(function(resolve, reject) {
				var drink = random.fromArray(drinks);
				var similar = drinks.filter(function(d) {
					return drink.name != d.name;
				}).sort(function(a, b) {
					return countCommon(drink.ingredients, b.ingredients) - countCommon(drink.ingredients, a.ingredients);
				});

				resolve({
					text : "What drink do you get if you mix the following ingredients?",
					answers : [
						drink.name,
						similar[0].name,
						similar[1].name,
						similar[2].name
					],
					correct : drink.name,
					view : {
						player : 'list',
						list : drink.ingredients
					}
				});
			});
		}

		function loadRandomDrink() {
			return $http.get('https://www.thecocktaildb.com/api/json/v1/1/random.php');
		}

		function countCommon(arr1, arr2) {
			return arr1.reduce(function(acc, cur) {
				if (arr2.indexOf(cur) > -1) {
					return acc + 1;
				} else {
					return acc;
				}
			}, 0);
		}
	}
	return new DrinksQuestions();
});
