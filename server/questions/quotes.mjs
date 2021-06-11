import fetch from 'node-fetch';
import nlp from 'compromise';
import quotesy from 'quotesy';

const TOTAL_QUOTES = 50;

class QuotesQuestions {
	constructor() {
		this._quotes = [];
		this._types = {
			author : {
				title : (correct) => "Who said this famous quote?",
				correct : (correct) => this._randomQuote(correct),
				similar : (correct, selector) => this._similarAuthors(correct, selector),
				load : (correct) => this._loadQuote(correct),
				format : (correct) => this._resolveAuthor(correct),
				weight : 50
			},
			word : {
				title : (correct) => "Which word is missing from this quote?",
				correct : (correct) => this._randomBlankQuote(correct),
				similar : (correct, selector) => this._similarWords(correct, selector),
				load : (correct) => this._loadQuote(correct),
				format : (correct) => this._formatWord(correct),
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
				{ url: 'https://github.com/dwyl/quotes', name: 'Quotesy' }
			]
		};
	}

	async preload(progress, cache, game) {
		progress(0, TOTAL_QUOTES);
		this._quotes = await this._loadQuotes(cache, progress);
		progress(TOTAL_QUOTES, TOTAL_QUOTES);
		return this._countQuestions();
	}

	async nextQuestion(selector) {
		let type = selector.fromWeightedObject(this._types);
		let quote = type.correct(selector);

		return ({
			text : type.title(quote),
			answers : selector.alternatives(type.similar(quote, selector), quote, type.format, (arr) => selector.splice(arr)),
			correct : type.format(quote),
			view : type.load(quote)
		});
	}

	_countQuestions() {
		return this._quotes.length * Object.keys(this._types).length;
	}

	_randomQuote(selector) {
		return selector.fromArray(this._quotes);
	}

	_randomBlankQuote(selector) {
		let quote = selector.fromArray(this._quotes);
		let nlps = [(n) => n.adjectives(), (n) => n.verbs(), (n) => n.nouns()];
		var word;

		do {
			word = nlps.shift()(nlp(quote.text)).random(1).trim().out('text');
		}
		while (!word);

		return {
			text : quote.text.replace(this._formatWord({ word : word }), "_____"),
			author : quote.author,
			word : word
		}
	}

	_similarAuthors(quote, selector) {
		return this._quotes;
	}

	_similarWords(quote, selector) {
		function sameTags(aWord, bWord) {
			let a = nlp(aWord).out('tags');
			let b = nlp(bWord).out('tags');	

			let aValues = Object.values(a);
			let bValues = Object.values(b);
			if (aValues.length != bValues.length) {
				return false;
			}

			return aValues.every((i) => a[i] == b[i]);
		}

		var words = this._quotes.map((q) => nlp(q.text).terms().trim().out('array')); //Extract words
		words = [].concat.apply([], words); //Flatten array of arrays
		words = words.filter((word, index) => word != '' && words.indexOf(word) == index); //Remove duplicates
		words = words.filter((word) => sameTags(word, quote.word)); //Find the same type of word
		return words.map((w) => ({ word : w }));
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
			quote : quote.text,
			attribution : {
				title : "Quoted",
				name : quote.author,
				links : []
			}
		};
	}

	async _loadQuotes(cache, progress) {
		progress(0, 1);
		let result = quotesy.parse_json();
		progress(1, 1);
		return result;
	}
}

export default QuotesQuestions;