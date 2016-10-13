triviaApp.service('quotes', function($http, apikeys) {
	function QuotesQuestions() {
		var self = this;
		var quotes = [];
		var TOTAL_QUOTES = 50;

		self.describe = function() {
			return {
				type : 'quotes',
				name : 'Famous Quotes',
				icon : 'fa-quote-right'
			};
		}

		self.preload = function(progress, cache) {
			return cache.get('quotes', function(resolve, reject) {
				progress(0, TOTAL_QUOTES);

				var promises = [];
				var result = [];
				for (var i = 0; i < TOTAL_QUOTES; i++) {
					promises.push(loadRandomQuote());
				}
				for (var i = 0; i < (promises.length - 1); i++) {
					promises[i].then(function(response) {
						result.push(response.data);
						progress(result.length, TOTAL_QUOTES);
						return promises[i + 1];
					});
				}
				promises[promises.length - 1].then(function(response) {
					result.push(response.data);
					resolve(result);
				});
			}).then(function(data) {
				quotes = data;
			});
		}


		self.nextQuestion = function(random) {
			return new Promise(function(resolve, reject) {
				var quote = random.fromArray(quotes);
				var similar = quotes.filter(function(q) {
					return quote.author != q.author;
				});

				resolve({
					text : "Who said this famous quote?",
					answers : [
						quote.author,
						random.splice(similar).author,
						random.splice(similar).author,
						random.splice(similar).author
					],
					correct : quote.author,
					view : {
						player : 'quote',
						quote : quote.quote
					}
				});
			});
		}

		function loadRandomQuote() {
			return $http.post('https://andruxnet-random-famous-quotes.p.mashape.com',{}, {
				params : {
					'cat' : 'famous'
				},
				headers : {
					'X-Mashape-Key' : apikeys.mashape
				}
			});
		}
	}
	return new QuotesQuestions();
});
