import fetch from 'node-fetch';
import QuestionSelector from '../selector.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

class GeographyQuestions {
	constructor(config) {
		this._countries = [];

		this._types = {
			flags : {
				title : (correct) => "Which country does this flag belong to?",
				format : (correct) => this._formatName(correct),
				correct : () => this._randomCountry(),
				similar : (correct) => this._similarCountries(correct),
				load : (correct) => this._loadFlag(correct),
				weight : 30,
				attribution: "Flag"
			},
			shape : {
				title : (correct) => "Which country has this shape?",
				format : (correct) => this._formatName(correct),
				correct : () => this._randomCountry(),
				similar : (correct) => this._similarCountries(correct),
				load : (correct) => this._loadMap(correct),
				weight : 15,
				attribution: "Image of"
			},
			highpopulation : {
				title : (correct) => "Which of these countries has the largest population?",
				format : (correct) => this._formatName(correct),
				correct : () => this._randomNonMicroCountry(),
				similar : (correct) => this._similarPopulationCountries(correct),
				load : (correct) => this._loadBlank(),
				weight : 10,
				attribution: "Country"
			},
			capital : {
				title : (correct) => "In which country is " + correct.capital + " the capital?",
				format : (correct) => this._formatName(correct),
				correct : () => this._randomCountryWithCapital(),
				similar : (correct) => this._similarCountries(correct),
				load : (correct) => this._loadBlank(),
				weight : 15,
				attribution: "Country"
			},
			borders : {
				title : (correct) => "Which country has borders to all these countries?",
				format : (correct) => this._formatName(correct),
				correct : () => this._randomCountryWith2Neighbours(),
				similar : (correct) => this._similarNeighbouringCountries(correct),
				load : (correct) => this._loadNeighbours(correct),
				weight : 10,
				attribution: "Country"
			},
			region : {
				title : (correct) => "Where is " + correct.name + " located?",
				format : (correct) => this._formatRegion(correct),
				correct : () => this._randomCountry(),
				similar : (correct) => this._allCountriesRandom(correct),
				load : (correct) => this._loadBlank(),
				weight : 10,
				attribution: "Country"
			},
			area : {
				title : (correct) => "Which of these countries has the largest land area?",
				format : (correct) => this._formatName(correct),
				correct : () => this._randomNonMicroCountry(),
				similar : (correct) => this._similarAreaCountries(correct),
				load : (correct) => this._loadBlank(),
				weight : 10,
				attribution: "Country"
			}
		}
	}

	describe() {
		return {
			name : 'Geography',
			icon : 'fa-globe-europe',
			attribution : [
				{ url: 'https://restcountries.eu', name: 'REST Countries' },
				{ url: 'https://developers.google.com/chart', name: 'Google Charts' }
			]
		};
	}

	async preload(progress, cache) {
		progress(0, 1);
		this._countries = await this._loadCountries(cache);
		progress(1, 1);
		return this._countQuestions();
	}

	async nextQuestion() {
		let type = Random.fromWeightedObject(this._types);

		let correct = type.correct();
		let similar = type.similar(correct);
		let title = type.title(correct);
		let view = type.load(correct);
		

		view.attribution = {
			title : type.attribution,
			name : correct.name,
			links : ['https://restcountries.com', 'https://flagpedia.net?q=' + correct.code]
		}

		return ({
			text : title,
			answers : QuestionSelector.alternatives(similar, correct, type.format),
			correct : type.format(correct),
			view : view
		});
	}

	_countQuestions() {
		return this._countries.length * Object.keys(this._types).length;
	}

	_loadCountries(cache) {
		return cache.get('countries', (resolve, reject) => {
			fetch('https://restcountries.com/v3.1/all').
			then(this._toJSON).
			then((data) => {
				let result = data.map((country) => {
					return {
						code : country.cca2,
						region : !country.subregion ? country.region : country.subregion,
						name : country.name.common,
						population : country.population,
						capital : country.capital ? country.capital[0] : undefined, 
						area : country.area,
						neighbours : (country.borders || []).map((code) => data.find((c) => code == c.cca3).name.common)
					}
				}).filter(country => !!country.region && !!country.capital);
				console.log(result.length);
				resolve(result);
			}).catch(reject);
		});
	}

	_randomCountry() {
		return Random.fromArray(this._countries);
	}

	_randomNonMicroCountry() {
		return Random.fromArray(this._countries, c => c.population > 50000 && c.area > 50000);
	}


	_randomCountryWithCapital() {
		return Random.fromArray(this._countries, c => !!c.capital);
	}

	_randomCountryWith2Neighbours() {
		return Random.fromArray(this._countries, c => c.neighbours.length >= 2);
	}

	_allCountries() {
		return Generators.random(this._countries);
	}

	_allCountriesRandom() {
		return Generators.sorted(this._countries);
	}

	_similarNeighbouringCountries(country) {
		let result = this._countries.filter(c => country.region == c.region && !country.neighbours.includes(c)).filter(c => !country.neighbours.every((o) => c.neighbours.includes(o)));
		return Generators.sorted(result);
	}

	_similarCountries(country) {
		let result = this._countries.filter(function(c) {
			return country.region == c.region;
		});
		return Generators.sorted(result);
	}

	_similarAreaCountries(country) {
		function areaSort(c) {
			return Math.floor(Math.log(c.area));
		}

		let result = this._countries.filter((c) => c.area < country.area).sort((a, b) => areaSort(b) - areaSort(a));
		return Generators.sorted(result);
	}

	_similarPopulationCountries(country) {
		function populationSort(c) {
			return Math.floor(Math.log(c.population));
		}

		let result = this._countries.filter((c) => c.population < country.population).sort((a, b) => populationSort(b) - populationSort(a));
		return Generators.sorted(result);
	}

	_formatName(country) {
		return country.name;
	}

	_formatRegion(country) {
		return country.region;
	}

	_loadFlag(country) {
		return {
			player : 'image',
			url : 'https://flagcdn.com/' + country.code.toLowerCase() + '.svg'
		};
	}

	_loadMap(country) {
		return {
			player : 'image',
			url : 'https://chart.googleapis.com/chart?cht=map&chs=590x500&chld=' + country.code + '&chco=00000000|307bbb&chf=bg,s,00000000&cht=map:auto=50,50,50,50'
		};
	}

	_loadNeighbours(correct) {
		return {
			player : 'list',
			list : correct.neighbours
		};
	}

	_loadBlank() {
		return {};
	}

	_toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}
}

export default GeographyQuestions;