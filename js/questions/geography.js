triviaApp.service('geography', function($http) {
	function GeographyQuestions() {
		var self = this;
		var countries = [];

		var types = {
			flags : {
				title : function(correct) { return "What country does this flag belong to?" },
				correct : randomCountry,
				similar : similarCountries,
				load : function(correct) {
					return loadImage('https://flagpedia.net/data/flags/normal/' + correct.code.toLowerCase() + '.png');
				}
			},
			shape : {
				title : function(correct) { return "What country has this shape?" },
				correct : randomCountry,
				similar : similarCountries,
				load : function(correct) {
					return loadImage('https://chart.googleapis.com/chart?cht=map&chs=590x500&chld=' + correct.code + '&chco=333333|307bbb&chf=bg,s,333333&cht=map:auto=50,50,50,50');
				}
			},
			highpopulation : {
				title : function(correct) { return "Which country has the largest population?" },
				correct : randomCountry,
				similar : similarPopulationCountries,
				load : function(correct) {
					return loadBlank();
				}
			},
			capital : {
				title : function(correct) { return "In what country is " + correct.capital + " the capital?" },
				correct : randomCountry,
				similar : similarCountries,
				load : function(correct) {
					return loadBlank();
				}
			}
		}

		self.describe = function() {
			return {
				type : 'geography',
				name : 'Geography',
				icon : 'fa-globe'
			};
		}

		self.preload = function(progress, cache) {
			return cache.get('countries', function(resolve, reject) {
				$http.get('https://restcountries.eu/rest/v1/all').then(function(response) {
					var result = response.data.map(function(country) {
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

		self.nextQuestion = function(random) {
			return new Promise(function(resolve, reject) {
				var type = random.fromArray(Object.keys(types));

				var correct = types[type].correct(random);
				var similar = types[type].similar(correct);
				var title = types[type].title(correct);

				types[type].load(correct).then(function(view) {
					resolve({
						text : title,
						answers : [
							correct.name,
							similar[0],
							similar[1],
							similar[2]
						],
						correct : correct.name,
						view : view
					});
				}).catch(function(err) {
					self.nextQuestion(random).then(function(question) {
						resolve(question);
					});
				});
			});
		}

		function randomCountry(random) {
			return random.fromArray(countries);
		}

		function similarCountries(country) {
			return countries.filter(function(c) {
				return c.code != country.code && country.region == c.region;
			}).map(function(c) {
				return c.name;
			});
		}

		function similarPopulationCountries(country) {
			function populationSort(c) {
				return Math.floor(Math.log(c.population));
			}

			var similar = countries.filter(function(c) {
				return c.code != country.code && c.population < country.population;
			}).sort(function(a, b) {
				return populationSort(b) - populationSort(a);
			}).map(function(c) {
				return c.name;
			});
			return similar;
		}

		function loadImage(url) {
			return new Promise(function(resolve, reject) {
				var img = new Image();
				img.onload = function() {
					resolve({
						player : 'image',
						url : url
					});
				};
				img.onerror = function() {
					console.log("Could not load " + img.src);
					reject();
				}
				img.src = url;
			});
		}

		function loadBlank() {
			return new Promise(function(resolve, reject) {
				resolve({});
			});
		}
	}

	return new GeographyQuestions();
});
