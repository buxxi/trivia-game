import fetch from 'node-fetch';
import Selector from '../selector.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';
import Questions from './questions.mjs';

const TOTAL_DRINKS = 50;

class DrinksQuestions extends Questions {
	constructor(config, categoryName) {
		super(config, categoryName);
		this._drinks = [];
	
		this._addQuestion({
			title : () => "Which drink do you get if you mix the following ingredients?",
			correct : (correct) => this._randomDrink(correct),
			similar : (correct) => this._similarDrinks(correct),
			load : (correct) => this._loadList(correct),
			format : (correct) => this._resolveName(correct),
			weight : 50
		});
		this._addQuestion({
			title : (correct) => "Which of these ingredients do you need to make a " + correct.drink.name + "?",
			correct : (correct) => this._randomIngredient(correct),
			similar : (correct) => this._differentIngredients(correct),
			load : (correct) => this._loadBlankIngredient(correct),
			format : (correct) => this._resolveName(correct),
			weight : 25
		});
		this._addQuestion({
			title : (correct) => "Which kind of glass should you serve a " + correct.name + " in?",
			correct : (correct) => this._randomDrinkWithGlass(correct),
			similar : (correct) => this._drinksWithGlass(correct),
			load : (correct) => this._loadBlankDrink(correct),
			format : (correct) => this._resolveGlass(correct),
			weight : 25
		});
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

	async preload(language, progress, cache) {
		this._onlyEnglish(language);
		progress(0, TOTAL_DRINKS);
		this._drinks = await this._loadDrinks(cache, progress);
		progress(TOTAL_DRINKS, TOTAL_DRINKS);
		return this._countQuestions();
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

	_randomIngredient() {
		let drink = Random.fromArray(this._drinks);
		let ingredient = Random.fromArray(drink.ingredients);
		return {
			name : ingredient,
			drink : drink
		}
	}

	_randomDrinkWithGlass() {
		return Random.fromArray(this._drinks.filter((d) => d.glass != 'vote'));
	}

	_randomDrink() {
		return Random.fromArray(this._drinks);
	}

	_drinksWithGlass(drink) {
		return Generators.random(this._drinks.filter((d) => d.glass != 'vote'));
	}

	_similarDrinks(drink) {
		return Generators.sortedCompareCorrect(this._drinks, Selector.countCommon, drink, e => e.ingredients);
	}

	_differentIngredients(ingredient) {
		let result = this._drinks.filter((d) => Selector.hasNoneCommon(ingredient.drink, d, e => e.ingredients)).map((d) => ({name : Random.fromArray(d.ingredients)}));
		return Generators.random(result);
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