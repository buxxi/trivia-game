import fetch from 'node-fetch';

const TOTAL_DRINKS = 50;

class DrinksQuestions {
	constructor(config) {
		this._drinks = [];
	
		this._types = {
			all : {
				title : (correct) => "Which drink do you get if you mix the following ingredients?",
				correct : (correct) => this._randomDrink(correct),
				similar : (correct, selector) => this._similarDrinks(correct, selector),
				load : (correct) => this._loadList(correct),
				format : (correct) => this._resolveName(correct),
				randomAnswer : false,
				weight : 50
			},
			single : {
				title : (correct) => "Which of these ingredients do you need to make a " + correct.drink.name + "?",
				correct : (correct) => this._randomIngredient(correct),
				similar : (correct, selector) => this._differentIngredients(correct, selector),
				load : (correct) => this._loadBlankIngredient(correct),
				format : (correct) =>this._resolveName(correct),
				randomAnswer : true,
				weight : 25
			},
			glass : {
				title : (correct) => "Which kind of glass should you serve a " + correct.name + " in?",
				correct : (correct) => this._randomDrinkWithGlass(correct),
				similar : (correct, selector) => this._drinksWithGlass(correct, selector),
				load : (correct) => this._loadBlankDrink(correct),
				format : (correct) => this._resolveGlass(correct),
				randomAnswer : true,
				weight : 25
			}
		};
	}

	describe() {
		return {
			name : 'Drinks',
			icon : 'fa-glass-martini-alt',
			attribution : [
				{ url: 'https://www.thecocktaildb.com', name: 'TheCocktailDB' }
			]
		};
	}

	async preload(progress, cache) {
		progress(0, TOTAL_DRINKS);
		this._drinks = await this._loadDrinks(cache, progress);
		progress(TOTAL_DRINKS, TOTAL_DRINKS);
		return this._countQuestions();
	}

	async nextQuestion(selector) {
		let type = selector.fromWeightedObject(this._types);
		let correct = type.correct(selector);

		return ({
			text : type.title(correct),
			answers : selector.alternatives(type.similar(correct, selector), correct, type.format, type.randomAnswer ? arr => selector.splice(arr) : arr => selector.first(arr)),
			correct : type.format(correct),
			view : type.load(correct)
		});
	}

	_countQuestions() {
		return this._drinks.length * Object.keys(this._types).length;
	}

	_loadDrinks(cache, progress) {
		return cache.get('drinks', async (resolve, reject) => {
			progress(0, TOTAL_DRINKS);

			try {
				for (let i = 0; i < TOTAL_DRINKS; i++) {
					let drink = await this._loadRandomDrink();
					if (!this._drinks.some(d => d.name == drink.name)) {
						this._drinks.push(drink);
					}
					progress(this._drinks.length, TOTAL_DRINKS);
				}
				resolve(this._drinks);
			} catch (e) {
				reject(e);
			}

		});
	}

	async _loadRandomDrink() {
		let response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
		let responseData = await this._toJSON(response);
		
		let data = responseData.drinks[0];
		let drink = {
			name : data['strDrink'],
			ingredients : Object.keys(data).filter((k) => k.indexOf("strIngredient") > -1).map((k) => data[k]).filter((v) => !!v),
			glass : data['strGlass'],
			url : 'https://www.thecocktaildb.com/drink.php?c=' + data['idDrink']
		}
		return drink;
	}

	_toJSON(response) {
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}

	_randomIngredient(selector) {
		let drink = selector.fromArray(this._drinks);
		let ingredient = selector.fromArray(drink.ingredients);
		return {
			name : ingredient,
			drink : drink
		}
	}

	_randomDrinkWithGlass(selector) {
		return selector.fromArray(this._drinks.filter((d) => d.glass != 'vote'));
	}

	_randomDrink(selector) {
		return selector.fromArray(this._drinks);
	}

	_drinksWithGlass(drink, selector) {
		return this._drinks.filter((d) => d.glass != 'vote');
	}

	_similarDrinks(drink, selector) {
		return selector.sortCompareCorrect(this._drinks, selector.countCommon, drink, e => e.ingredients);
	}

	_differentIngredients(ingredient, selector) {
		return this._drinks.filter((d) => selector.hasNoneCommon(ingredient.drink, d, e => e.ingredients)).map((d) => ({name : selector.fromArray(d.ingredients)}));
	}

	_resolveGlass(correct) {
		return correct.glass;
	}

	_resolveName(correct) {
		return correct.name;
	}

	_loadBlankDrink(drink) {
		return {
			attribution : {
				title : "Drink",
				name : drink.name,
				links : [drink.url]
			}
		};
	}

	_loadBlankIngredient(ingredient) {
		return {
			attribution : {
				title : "Drink",
				name : ingredient.drink.name,
				links : [ingredient.drink.url]
			}
		};
	}

	_loadList(drink) {
		return {
			player : 'list',
			list : drink.ingredients,
			attribution : {
				title : "Drink",
				name : drink.name,
				links : [drink.url]
			}
		};
	}
}

export default DrinksQuestions;