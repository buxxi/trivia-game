const TOTAL_QUOTES = 50;

class QuotesQuestions {
	constructor() {
		this._quotes = [];	
		this._mashapeApiKey = '';
		this.types = {
			author : {
				title : (correct) => "Who said this famous quote?",
				correct : this._randomQuote,
				similar : this._similarAuthors,
				load : this._loadQuote,
				format : this._resolveAuthor,
				weight : 50
			},
			word : {
				title : (correct) => "Which word is missing from this quote?",
				correct : this._randomBlankQuote,
				similar : this._similarWords,
				load : this._loadQuote,
				format : this._formatWord,
				weight : 50
			}
		}
	}

	describe() {
		return {
			type : 'quotes',
			name : 'Famous Quotes',
			icon : 'fa-quote-right',
			attribution : [
				{ url: 'https://market.mashape.com/andruxnet/random-famous-quotes', name: 'Mashape - Famous Random Quotes' }
			],
			count : this._quotes.length
		};
	}

	preload(progress, cache, apikeys, game) {
		this._mashapeApiKey = apikeys.mashape;

		return new Promise(async (resolve, reject) => {
			try {
				progress(0, TOTAL_QUOTES);
				quotes = await this._loadQuotes(cache, progress);
				progress(TOTAL_QUOTES, TOTAL_QUOTES);
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	nextQuestion(selector) {
		return new Promise((resolve, reject) => {
			let type = selector.fromWeightedObject(this._types);
			let quote = type.correct(selector);

			resolve({
				text : type.title(quote),
				answers : selector.alternatives(type.similar(quote, selector), quote, type.format, selector.splice),
				correct : type.format(quote),
				view : type.load(quote)
			});
		});
	}

	_randomQuote(selector) {
		return selector.fromArray(quotes);
	}

	_randomBlankQuote(selector) {
		let quote = selector.fromArray(quotes);
		let nlps = [(nlp) => nlp.adjectives(), (nlp) => nlp.verbs(), (nlp) => nlp.nouns()];
		var word;

		do {
			word = nlps.shift()(nlp(quote.quote)).random(1).trim().out('text');
		}
		while (!word);

		return {
			quote : quote.quote.replace(this._formatWord({ word : word }), "_____"),
			author : quote.author,
			word : word
		}
	}

	_similarAuthors(quote, selector) {
		return this._quotes;
	}

	_similarWords(quote, selector) {
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

		var words = this._quotes.map((q) => nlp(q.quote).terms().trim().out('array')); //Extract words
		words = [].concat.apply([], words); //Flatten array of arrays
		words = words.filter((word, index) => word != '' && words.indexOf(word) == index); //Remove duplicates
		words = words.filter((word) => sameTags(word, quote.word)); //Find the same type of word
		return words.map((w) => ({ word : w}));
	}

	_formatWord(q) {
		let word = q.word;
		let result = /^.*?([^ .]+)[.]?$/.exec(word); //Use the last word if contains space and remove punctuations

		return result[1].toLowerCase();
	}

	_resolveAuthor(q) {
		return q.author;
	}

	_loadQuote(quote) {
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

	_loadQuotes(cache, progress) {
		return cache.get('quotes', async (resolve, reject) => {
			try {
				for (var i = 0; i < TOTAL_QUOTES; i++) {
					let quote = await this._loadRandomQuote();
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

	_loadRandomQuote() {
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
					'X-Mashape-Key' : this._mashapeApiKey
				}
			}).then(toJSON).then((data) => resolve(data[0])).catch(reject);
		});
	}
}

module.exports = QuotesQuestions;