function GeographyQuestions($http) {
	var self = this;
	var countries = [];

	var types = {
		flags : {
			title : (correct) => "Which country does this flag belong to?",
			format : formatName,
			correct : randomCountry,
			similar : similarCountries,
			load : (correct) => loadImage(correct.flag),
			weight : 30
		},
		shape : {
			title : (correct) => "Which country has this shape?",
			format : formatName,
			correct : randomCountry,
			similar : similarCountries,
			load : (correct) => loadImage('https://chart.googleapis.com/chart?cht=map&chs=590x500&chld=' + correct.code + '&chco=00000000|307bbb&chf=bg,s,00000000&cht=map:auto=50,50,50,50'),
			weight : 15
		},
		highpopulation : {
			title : (correct) => "Which of these countries has the largest population?",
			format : formatName,
			correct : randomCountry,
			similar : similarPopulationCountries,
			load : (correct) => loadBlank(),
			weight : 10
		},
		capital : {
			title : (correct) => "In which country is " + correct.capital + " the capital?",
			format : formatName,
			correct : randomCountry,
			similar : similarCountries,
			load : (correct) => loadBlank(),
			weight : 15
		},
		borders : {
			title : (correct) => "Which country has borders to all these countries: " + correct.neighbours + "?",
			format : formatName,
			correct : randomCountryWith2Neighbours,
			similar : similarNeighbouringCountries,
			load : (correct) => loadBlank(),
			weight : 10
		},
		region : {
			title : (correct) => "Where is " + correct.name + " located?",
			format : formatRegion,
			correct : randomCountry,
			similar : allCountries,
			load : (correct) => loadBlank(),
			weight : 10
		},
		area : {
			title : (correct) => "Which of these countries has the largest land area?",
			format : formatName,
			correct : randomCountry,
			similar : similarAreaCountries,
			load : (correct) => loadBlank(),
			weight : 10
		}
	}

	self.describe = function() {
		return {
			type : 'geography',
			name : 'Geography',
			icon : 'fa-globe',
			count : countries.length * Object.keys(types).length
		};
	}

	self.preload = function(progress, cache, apikeys) {
		return cache.get('countries', (resolve, reject) => {
			$http.get('https://restcountries.eu/rest/v2/all').then((response) => {
				var result = response.data.map((country) => {
					return {
						code : country.alpha2Code,
						region : country.subregion,
						name : country.name,
						population : country.population,
						capital : country.capital,
						area : country.area,
						neighbours : country.borders.map((code) => response.data.find((c) => code == c.alpha3Code).name),
						flag : country.flag
					}
				});
				resolve(result);
			});
		}).then(function(data) {
			countries = data;
		});
	}

	self.nextQuestion = function(selector) {
		return new Promise((resolve, reject) => {
			var type = selector.fromWeightedObject(types);

			var correct = type.correct(selector);
			var similar = type.similar(correct);
			var title = type.title(correct);

			type.load(correct).then((view) => {
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
			}).catch(reject);
		});
	}

	function randomCountry(selector) {
		return selector.fromArray(countries);
	}

	function randomCountryWith2Neighbours(selector) {
		return selector.fromArray(countries.filter((c) => c.neighbours.length >= 2));
	}

	function allCountries() {
		return countries;
	}

	function similarNeighbouringCountries(country) {
		return similarCountries(country).filter(c => !country.neighbours.includes(c)).filter(c => !country.neighbours.every((o) => c.neighbours.includes(o)));
	}

	function similarCountries(country) {
		return countries.filter(function(c) {
			return country.region == c.region;
		});
	}

	function similarAreaCountries(country) {
		function areaSort(c) {
			return Math.floor(Math.log(c.area));
		}

		return countries.filter((c) => c.area < country.area).sort((a, b) => areaSort(b) - areaSort(a));
	}

	function similarPopulationCountries(country) {
		function populationSort(c) {
			return Math.floor(Math.log(c.population));
		}

		return countries.filter((c) => c.population < country.population).sort((a, b) => populationSort(b) - populationSort(a));
	}

	function formatName(country) {
		return country.name;
	}

	function formatRegion(country) {
		return country.region;
	}

	function loadImage(url) {
		return new Promise((resolve, reject) => {
			resolve({
				player : 'image',
				url : url
			});
		});
	}

	function loadBlank() {
		return new Promise((resolve, reject) => {
			resolve({});
		});
	}
}
