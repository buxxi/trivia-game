export default function DrinksQuestions() {
	var self = this;
	var drinks = [];
	var TOTAL_DRINKS = 50;
	var types = {
		all : {
			title : (correct) => "What drink do you get if you mix the following ingredients?",
			correct : randomDrink,
			similar : similarDrinks,
			load : loadList,
			format : resolveName,
			randomAnswer : false,
			weight : 50
		},
		single : {
			title : (correct) => "Which of these ingredients do you need to make a " + correct.drink.name + "?",
			correct : randomIngredient,
			similar : differentIngredients,
			load : loadBlankIngredient,
			format : resolveName,
			randomAnswer : true,
			weight : 25
		},
		glass : {
			title : (correct) => "What kind of glass should you serve a " + correct.name + " in?",
			correct : randomDrinkWithGlass,
			similar : drinksWithGlass,
			load : loadBlankDrink,
			format : resolveGlass,
			randomAnswer : true,
			weight : 25
		}
	};

	self.describe = function() {
		return {
			type : 'drinks',
			name : 'Drinks',
			icon : 'fa-glass',
			attribution : [
				{ url: 'https://www.thecocktaildb.com', name: 'TheCocktailDB' }
			],
			count : drinks.length * Object.keys(types).length
		};
	}

	self.preload = function(progress, cache, apikeys, game) {
		return new Promise(async (resolve, reject) => {
			try {
				progress(0, TOTAL_DRINKS);
				drinks = await loadDrinks(cache, progress);
				progress(TOTAL_DRINKS, TOTAL_DRINKS);
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}


	self.nextQuestion = function(selector) {
		return new Promise((resolve, reject) => {
			let type = selector.fromWeightedObject(types);
			let correct = type.correct(selector);

			resolve({
				text : type.title(correct),
				answers : selector.alternatives(type.similar(correct, selector), correct, type.format, type.randomAnswer ? selector.splice : selector.first),
				correct : type.format(correct),
				view : type.load(correct)
			});
		});
	}

	function loadDrinks(cache, progress) {
		return cache.get('drinks', async (resolve, reject) => {
			progress(0, TOTAL_DRINKS);

			try {
				for (let i = 0; i < TOTAL_DRINKS; i++) {
					let drink = await loadRandomDrink();
					if (!drinks.some(d => d.name == drink.name)) {
						drinks.push(drink);
					}
					progress(drinks.length, TOTAL_DRINKS);
				}
				resolve(drinks);
			} catch (e) {
				reject(e);
			}

		});
	}

	function loadRandomDrink() {
		function toJSON(response) { //TODO: copy pasted
			if (!response.ok) {
				throw response;
			}
			return response.json();
		}

		return new Promise((resolve, reject) => {
			fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php').then(toJSON).then((responseData) => {
				let data = responseData.drinks[0];
				let drink = {
					name : data['strDrink'],
					ingredients : Object.keys(data).filter((k) => k.indexOf("strIngredient") > -1).map((k) => data[k]).filter((v) => !!v),
					glass : data['strGlass'],
					url : 'https://www.thecocktaildb.com/drink.php?c=' + data['idDrink']
				}
				resolve(drink);
			}).catch(reject);
		});
	}

	function randomIngredient(selector) {
		let drink = selector.fromArray(drinks);
		let ingredient = selector.fromArray(drink.ingredients);
		return {
			name : ingredient,
			drink : drink
		}
	}

	function randomDrinkWithGlass(selector) {
		return selector.fromArray(drinks.filter((d) => d.glass != 'vote'));
	}

	function randomDrink(selector) {
		return selector.fromArray(drinks);
	}

	function drinksWithGlass(drink, selector) {
		return drinks.filter((d) => d.glass != 'vote');
	}

	function similarDrinks(drink, selector) {
		return drinks.slice().sort((a, b) => {
				return selector.countCommon(drink.ingredients, b.ingredients) - selector.countCommon(drink.ingredients, a.ingredients);
		});
	}

	function differentIngredients(ingredient, selector) {
		return drinks.filter((d) => selector.countCommon(ingredient.drink.ingredients, d.ingredients) == 0).map((d) => ({name : selector.fromArray(d.ingredients)}));
	}

	function resolveGlass(correct) {
		return correct.glass;
	}

	function resolveName(correct) {
		return correct.name;
	}

	function loadBlankDrink(drink) {
		return {
			attribution : {
				title : "Featured drink",
				name : drink.name,
				links : [drink.url]
			}
		};
	}

	function loadBlankIngredient(ingredient) {
		return {
			attribution : {
				title : "Featured drink",
				name : ingredient.drink.name,
				links : [ingredient.drink.url]
			}
		};
	}

	function loadList(drink) {
		return {
			player : 'list',
			list : drink.ingredients,
			attribution : {
				title : "Featured drink",
				name : drink.name,
				links : [drink.url]
			}
		};
	}
}
