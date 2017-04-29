function GeographyQuestions($http) {
	var self = this;
	var countries = [];

	var types = {
		flags : {
			title : (correct) => "What country does this flag belong to?",
			correct : randomCountry,
			similar : similarCountries,
			load : (correct) => loadImage('https://flagpedia.net/data/flags/normal/' + correct.code.toLowerCase() + '.png'),
			weight : 40
		},
		shape : {
			title : (correct) => "What country has this shape?",
			correct : randomCountry,
			similar : similarCountries,
			load : (correct) => loadImage('https://chart.googleapis.com/chart?cht=map&chs=590x500&chld=' + correct.code + '&chco=000000|307bbb&chf=bg,s,000000&cht=map:auto=50,50,50,50'),
			weight : 30
		},
		highpopulation : {
			title : (correct) => "Which country has the largest population?",
			correct : randomCountry,
			similar : similarPopulationCountries,
			load : (correct) => loadBlank(),
			weight : 10
		},
		capital : {
			title : (correct) => "In what country is " + correct.capital + " the capital?",
			correct : randomCountry,
			similar : similarCountries,
			load : (correct) => loadBlank(),
			weight : 20
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
			$http.get('https://restcountries.eu/rest/v1/all').then((response) => {
				var result = response.data.map((country) => {
					return {
						code : country.alpha2Code,
						region : country.subregion,
						name : country.name,
						population : country.population,
						capital : country.capital
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

			function resolveName(c) {
				return c.name;
			}

			type.load(correct).then((view) => {
				view.attribution = {
					title : "Featured country",
					name : correct.name,
					links : ['https://restcountries.eu', 'https://flagpedia.net?q=' + correct.code]
				}

				resolve({
					text : title,
					answers : selector.alternatives(similar, correct, resolveName, selector.first),
					correct : resolveName(correct),
					view : view
				});
			}).catch(reject);
		});
	}

	function randomCountry(selector) {
		return selector.fromArray(countries);
	}

	function similarCountries(country) {
		return countries.filter(function(c) {
			return country.region == c.region;
		});
	}

	function similarPopulationCountries(country) {
		function populationSort(c) {
			return Math.floor(Math.log(c.population));
		}

		return countries.filter((c) => c.population < country.population).sort((a, b) => populationSort(b) - populationSort(a));
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
