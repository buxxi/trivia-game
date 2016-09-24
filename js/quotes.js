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

		self.preload = function(progress) {
			return new Promise(function(resolve, reject) {
				progress(0, TOTAL_QUOTES);

				var promises = [];
				for (var i = 0; i < TOTAL_QUOTES; i++) {
					promises.push(loadRandomQuote());
				}
				for (var i = 0; i < (promises.length - 1); i++) {
					promises[i].then(function(response) {
						quotes.push(response.data);
						progress(quotes.length, TOTAL_QUOTES);
						return promises[i + 1];
					});
				}
				promises[promises.length - 1].then(function(response) {
					quotes.push(response.data);
					resolve();
				});
			});
		}


		self.nextQuestion = function(random) {
			return new Promise(function(resolve, reject) {
				var quote = random.fromArray(quotes);
				var similar = quotes.filter(function(q) {
					return quote.author != q.author;
				});

				console.log(quotes);
				console.log(similar);
				console.log(quote);

				resolve({
					text : "Who said this famous quote?",
					answers : [
						quote.author,
						similar[0].author,
						similar[1].author,
						similar[2].author
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
