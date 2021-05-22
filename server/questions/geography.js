class GeographyQuestions {
	constructor() {
		this._countries = [];

		this._types = {
			flags : {
				title : (correct) => "Which country does this flag belong to?",
				format : this._formatName,
				correct : this._randomCountry,
				similar : this._similarCountries,
				load : (correct) => this._loadImage(correct.flag),
				weight : 30
			},
			shape : {
				title : (correct) => "Which country has this shape?",
				format : this._formatName,
				correct : this._randomCountry,
				similar : this._similarCountries,
				load : (correct) => this._loadImage('https://chart.googleapis.com/chart?cht=map&chs=590x500&chld=' + correct.code + '&chco=00000000|307bbb&chf=bg,s,00000000&cht=map:auto=50,50,50,50'),
				weight : 15
			},
			highpopulation : {
				title : (correct) => "Which of these countries has the largest population?",
				format : this._formatName,
				correct : this._randomCountry,
				similar : this._similarPopulationCountries,
				load : (correct) => loadBlank(),
				weight : 10
			},
			capital : {
				title : (correct) => "In which country is " + correct.capital + " the capital?",
				format : this._formatName,
				correct : this._randomCountry,
				similar : this._similarCountries,
				load : (correct) => loadBlank(),
				weight : 15
			},
			borders : {
				title : (correct) => "Which country has borders to all these countries: " + correct.neighbours + "?",
				format : this._formatName,
				correct : this._randomCountryWith2Neighbours,
				similar : this._similarNeighbouringCountries,
				load : (correct) => loadBlank(),
				weight : 10
			},
			region : {
				title : (correct) => "Where is " + correct.name + " located?",
				format : this._formatRegion,
				correct : this._randomCountry,
				similar : this._allCountries,
				load : (correct) => loadBlank(),
				weight : 10
			},
			area : {
				title : (correct) => "Which of these countries has the largest land area?",
				format : this._formatName,
				correct : this._randomCountry,
				similar : this._similarAreaCountries,
				load : (correct) => loadBlank(),
				weight : 10
			}
		}
	}

	describe() {
		return {
			type : 'geography',
			name : 'Geography',
			icon : 'fa-globe',
			attribution : [
				{ url: 'https://restcountries.eu', name: 'REST Countries' },
				{ url: 'https://developers.google.com/chart', name: 'Google Charts' }
			],
			count : countries.length * Object.keys(types).length
		};
	}

	preload(progress, cache, apikeys, game) {
		return new Promise(async (resolve, reject) => {
			try {
				progress(0, 1);
				countries = await loadCountries(cache);
				progress(1, 1);
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	nextQuestion(selector) {
		return new Promise(async (resolve, reject) => {
			try {
				var type = selector.fromWeightedObject(types);

				var correct = type.correct(selector);
				var similar = type.similar(correct);
				var title = type.title(correct);
				var view = await type.load(correct);
				view.attribution = {
					title : "Featured country",
					name : correct.name,
					links : ['https://restcountries.eu', 'https://flagpedia.net?q=' + correct.code]
				}

				resolve({
					text : title,
					answers : selector.alternatives(similar, correct, type.format, types['region'] == type ? selector.splice : selector.first),
					correct : type.format(correct),
					view : view
				});
			} catch (e) {
				reject(e);
			}
		});
	}

	_loadCountries(cache) {
		function toJSON(response) { //TODO: copy pasted
			if (!response.ok) {
				throw response;
			}
			return response.json();
		}

		return cache.get('countries', (resolve, reject) => {
			window.fetch('https://restcountries.eu/rest/v2/all').
			then(toJSON).
			then((data) => {
				let result = data.map((country) => {
					return {
						code : country.alpha2Code,
						region : country.subregion,
						name : country.name,
						population : country.population,
						capital : country.capital,
						area : country.area,
						neighbours : country.borders.map((code) => data.find((c) => code == c.alpha3Code).name),
						flag : country.flag
					}
				});
				resolve(result);
			}).catch(reject);
		});
	}

	_randomCountry(selector) {
		return selector.fromArray(countries);
	}

	_randomCountryWith2Neighbours(selector) {
		return selector.fromArray(countries.filter((c) => c.neighbours.length >= 2));
	}

	_allCountries() {
		return countries;
	}

	_similarNeighbouringCountries(country) {
		return similarCountries(country).filter(c => !country.neighbours.includes(c)).filter(c => !country.neighbours.every((o) => c.neighbours.includes(o)));
	}

	_similarCountries(country) {
		return countries.filter(function(c) {
			return country.region == c.region;
		});
	}

	_similarAreaCountries(country) {
		function areaSort(c) {
			return Math.floor(Math.log(c.area));
		}

		return countries.filter((c) => c.area < country.area).sort((a, b) => areaSort(b) - areaSort(a));
	}

	_similarPopulationCountries(country) {
		function populationSort(c) {
			return Math.floor(Math.log(c.population));
		}

		return countries.filter((c) => c.population < country.population).sort((a, b) => populationSort(b) - populationSort(a));
	}

	_formatName(country) {
		return country.name;
	}

	_formatRegion(country) {
		return country.region;
	}

	_loadImage(url) {
		return new Promise((resolve, reject) => {
			resolve({
				player : 'image',
				url : url
			});
		});
	}

	_loadBlank() {
		return new Promise((resolve, reject) => {
			resolve({});
		});
	}
}

module.exports = GeographyQuestions;