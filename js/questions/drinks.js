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

		self.preload = function(progress, cache) {
			return cache.get('drinks', (resolve, reject) => {
				var result = [];

				function parseDrink(response) {
					var data = response.data.drinks[0];
					var drink = {
						name : data['strDrink'],
						ingredients : Object.keys(data).filter((k) => k.indexOf("strIngredient") > -1).map((k) => data[k]).filter((v) => !!v),
						url : 'https://www.thecocktaildb.com/drink.php?c=' + data['idDrink']
					}
					result.push(drink);
				}

				progress(0, TOTAL_DRINKS);

				var promises = [];
				for (var i = 0; i < TOTAL_DRINKS; i++) {
					promises.push(loadRandomDrink());
				}
				for (var i = 0; i < (promises.length - 1); i++) {
					promises[i].then((response) => {
						parseDrink(response);
						progress(result.length, TOTAL_DRINKS);
						return promises[i + 1];
					});
				}
				promises[promises.length - 1].then((response) => {
					parseDrink(response);
					resolve(result);
				});
			}).then((data) => { drinks = data; });
		}


		self.nextQuestion = function(selector) {
			return new Promise((resolve, reject) => {
				var drink = selector.fromArray(drinks);

				function resolveName(d) { return d.name; }

				resolve({
					text : "What drink do you get if you mix the following ingredients?",
					answers : selector.alternatives(similar(drink, selector), drink, resolveName, selector.first),
					correct : resolveName(drink),
					view : {
						player : 'list',
						list : drink.ingredients,
						attribution : {
							title : "Featured drink",
							name : drink.name,
							links : [drink.url]
						}
					}
				});
			});
		}

		function similar(drink, selector) {
			return drinks.slice().sort((a, b) => {
					return selector.countCommon(drink.ingredients, b.ingredients) - selector.countCommon(drink.ingredients, a.ingredients);
			});
		}

		function loadRandomDrink() {
			return $http.get('https://www.thecocktaildb.com/api/json/v1/1/random.php');
		}
	}

	return new DrinksQuestions();
});
