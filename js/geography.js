triviaApp.service('geography', function($http) {
	function GeographyQuestions() {
		var self = this;
		var countries = [];

		self.describe = function() {
			return {
				type : 'geography',
				name : 'Flags',
				icon : 'fa-globe'
			};
		}

		self.preload = function(progress) {
			return new Promise(function(resolve, reject) {
				$http.get('https://restcountries.eu/rest/v1/all').then(function(response) {
					countries = response.data.map(function(country) {
						return {
							code : country.alpha2Code,
							region : country.subregion,
							name : country.name
						}
					});
					resolve();
				});
			});
		}

		self.nextQuestion = function(random) {
			return new Promise(function(resolve, reject) {
				var country = random.fromArray(countries);
				var similar = countries.filter(function(c) {
					return c.code != country.code && country.region == c.region;
				}).map(function(c) {
					return c.name;
				});

				var img = new Image();
				img.onload = function() {
					resolve({
						text : "What country does this flag belong to?",
						answers : [
							country.name,
							similar[0],
							similar[1],
							similar[2]
						],
						correct : country.name,
						view : {
							player : 'image',
							url : img.src,
						}
					});
				};
				img.onerror = function() {
					console.log("Could not load " + img.src);
					self.nextQuestion(random).then(function(question) {
						resolve(question);
					});
				}
				img.src = 'https://flagpedia.net/data/flags/normal/' + country.code.toLowerCase() + '.png'
			});
		}
	}

	return new GeographyQuestions();
});
