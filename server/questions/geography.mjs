import fetch from 'node-fetch';

class GeographyQuestions {
	constructor(config) {
		this._countries = [];

		this._types = {
			flags : {
				title : (correct) => "Which country does this flag belong to?",
				format : (correct) => this._formatName(correct),
				correct : (selector) => this._randomCountry(selector),
				similar : (correct) => this._similarCountries(correct),
				load : (correct) => this._loadFlag(correct),
				weight : 30,
				attribution: "Flag"
			},
			shape : {
				title : (correct) => "Which country has this shape?",
				format : (correct) => this._formatName(correct),
				correct : (selector) => this._randomCountry(selector),
				similar : (correct) => this._similarCountries(correct),
				load : (correct) => this._loadMap(correct),
				weight : 15,
				attribution: "Image of"
			},
			highpopulation : {
				title : (correct) => "Which of these countries has the largest population?",
				format : (correct) => this._formatName(correct),
				correct : (selector) => this._randomNonMicroCountry(selector),
				similar : (correct) => this._similarPopulationCountries(correct),
				load : (correct) => this._loadBlank(),
				weight : 10,
				attribution: "Country"
			},
			capital : {
				title : (correct) => "In which country is " + correct.capital + " the capital?",
				format : (correct) => this._formatName(correct),
				correct : (selector) => this._randomCountryWithCapital(selector),
				similar : (correct) => this._similarCountries(correct),
				load : (correct) => this._loadBlank(),
				weight : 15,
				attribution: "Country"
			},
			borders : {
				title : (correct) => "Which country has borders to all these countries?",
				format : (correct) => this._formatName(correct),
				correct : (selector) => this._randomCountryWith2Neighbours(selector),
				similar : (correct) => this._similarNeighbouringCountries(correct),
				load : (correct) => this._loadNeighbours(correct),
				weight : 10,
				attribution: "Country"
			},
			region : {
				title : (correct) => "Where is " + correct.name + " located?",
				format : (correct) => this._formatRegion(correct),
				correct : (selector) => this._randomCountry(selector),
				similar : (correct) => this._allCountries(correct),
				load : (correct) => this._loadBlank(),
				weight : 10,
				attribution: "Country"
			},
			area : {
				title : (correct) => "Which of these countries has the largest land area?",
				format : (correct) => this._formatName(correct),
				correct : (selector) => this._randomNonMicroCountry(selector),
				similar : (correct) => this._similarAreaCountries(correct),
				load : (correct) => this._loadBlank(),
				weight : 10,
				attribution: "Country"
			}
		}
	}

	describe() {
		return {
			type : 'geography',
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

	async nextQuestion(selector) {
		var type = selector.fromWeightedObject(this._types);

		var correct = type.correct(selector);
		var similar = type.similar(correct);
		var title = type.title(correct);
		var view = type.load(correct);
		view.attribution = {
			title : type.attribution,
			name : correct.name,
			links : ['https://restcountries.com', 'https://flagpedia.net?q=' + correct.code]
		}

		return ({
			text : title,
			answers : selector.alternatives(similar, correct, type.format, this._types['region'] == type ? arr => selector.splice(arr) : arr => selector.first(arr)),
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

	_randomCountry(selector) {
		return selector.fromArray(this._countries);
	}

	_randomNonMicroCountry(selector) {
		return selector.fromArray(this._countries, c => c.population > 50000 && c.area > 50000);
	}


	_randomCountryWithCapital(selector) {
		return selector.fromArray(this._countries, c => !!c.capital);
	}

	_randomCountryWith2Neighbours(selector) {
		return selector.fromArray(this._countries, c => c.neighbours.length >= 2);
	}

	_allCountries() {
		return this._countries;
	}

	_similarNeighbouringCountries(country) {
		return this._similarCountries(country).filter(c => !country.neighbours.includes(c)).filter(c => !country.neighbours.every((o) => c.neighbours.includes(o)));
	}

	_similarCountries(country) {
		return this._countries.filter(function(c) {
			return country.region == c.region;
		});
	}

	_similarAreaCountries(country) {
		function areaSort(c) {
			return Math.floor(Math.log(c.area));
		}

		return this._countries.filter((c) => c.area < country.area).sort((a, b) => areaSort(b) - areaSort(a));
	}

	_similarPopulationCountries(country) {
		function populationSort(c) {
			return Math.floor(Math.log(c.population));
		}

		return this._countries.filter((c) => c.population < country.population).sort((a, b) => populationSort(b) - populationSort(a));
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