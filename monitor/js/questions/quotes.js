export default function QuotesQuestions() {
	var self = this;
	var quotes = [];
	var TOTAL_QUOTES = 50;

	var mashapeApiKey = '';

	var types = {
		author : {
			title : (correct) => "Who said this famous quote?",
			correct : randomQuote,
			similar : similarAuthors,
			load : loadQuote,
			format : resolveAuthor,
			weight : 50
		},
		word : {
			title : (correct) => "Which word is missing from this quote?",
			correct : randomBlankQuote,
			similar : similarWords,
			load : loadQuote,
			format : formatWord,
			weight : 50
		}
	}

	self.describe = function() {
		return {
			type : 'quotes',
			name : 'Famous Quotes',
			icon : 'fa-quote-right',
			attribution : [
				{ url: 'https://market.mashape.com/andruxnet/random-famous-quotes', name: 'Mashape - Famous Random Quotes' }
			],
			count : quotes.length
		};
	}

	self.preload = function(progress, cache, apikeys, game) {
		mashapeApiKey = apikeys.mashape;

		return new Promise(async (resolve, reject) => {
			try {
				progress(0, TOTAL_QUOTES);
				quotes = await loadQuotes(cache, progress);
				progress(TOTAL_QUOTES, TOTAL_QUOTES);
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	self.nextQuestion = function(selector) {
		return new Promise((resolve, reject) => {
			var type = selector.fromWeightedObject(types);
			var quote = type.correct(selector);

			resolve({
				text : type.title(quote),
				answers : selector.alternatives(type.similar(quote, selector), quote, type.format, selector.splice),
				correct : type.format(quote),
				view : type.load(quote)
			});
		});
	}

	function randomQuote(selector) {
		return selector.fromArray(quotes);
	}

	function randomBlankQuote(selector) {
		var quote = selector.fromArray(quotes);
		var nlps = [(nlp) => nlp.adjectives(), (nlp) => nlp.verbs(), (nlp) => nlp.nouns()];
		var word;

		do {
			word = nlps.shift()(nlp(quote.quote)).random(1).trim().out('text');
		}
		while (!word);

		return {
			quote : quote.quote.replace(formatWord({ word : word }), "_____"),
			author : quote.author,
			word : word
		}
	}

	function similarAuthors(quote, selector) {
		return quotes;
	}

	function similarWords(quote, selector) {
		function sameTags(a, b) {
			a = nlp(a).list[0].terms[0].tags;
			b = nlp(b).list[0].terms[0].tags;

			var aKeys = Object.keys(a);
			var bKeys = Object.keys(b);
			if (aKeys.length != bKeys.length) {
				return false;
			}

			return aKeys.every((i) => a[i] == b[i]);
		}

		var words = quotes.map((q) => nlp(q.quote).terms().trim().out('array')); //Extract words
		words = [].concat.apply([], words); //Flatten array of arrays
		words = words.filter((word, index) => word != '' && words.indexOf(word) == index); //Remove duplicates
		words = words.filter((word) => sameTags(word, quote.word)); //Find the same type of word
		return words.map((w) => ({ word : w}));
	}

	function formatWord(q) {
		var word = q.word;
		var result = /^.*?([^ .]+)[.]?$/.exec(word); //Use the last word if contains space and remove punctuations

		return result[1].toLowerCase();
	}

	function resolveAuthor(q) {
		return q.author;
	}

	function loadQuote(quote) {
		return {
			player : 'quote',
			quote : quote.quote,
			attribution : {
				title : "Quoted",
				name : quote.author,
				links : []
			}
		};
	}

	function loadQuotes(cache, progress) {
		return cache.get('quotes', async (resolve, reject) => {
			try {
				for (var i = 0; i < TOTAL_QUOTES; i++) {
					let quote = await loadRandomQuote();
					if (!quotes.some(q => q.quote == quote.quote)) {
						quotes.push(quote);
					}
					
					progress(quotes.length, TOTAL_QUOTES);
				}
				resolve(quotes);
			} catch (e) {
				reject(e);
			}
		});	
	}

	function loadRandomQuote() {
		function toJSON(response) { //TODO: copy pasted
			if (!response.ok) {
				throw response;
			}
			return response.json();
		}

		return new Promise((resolve, reject) => {
			fetch('https://andruxnet-random-famous-quotes.p.mashape.com/?cat=famous',{
				method : 'POST',
				headers : {
					'X-Mashape-Key' : mashapeApiKey
				}
			}).then(toJSON).then((data) => resolve(data[0])).catch(reject);
		});
	}
}
