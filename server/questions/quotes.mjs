import nlp from 'compromise';
import adjectives from 'compromise-adjectives';
import quotesy from 'quotesy';

nlp.extend(adjectives);

class QuotesQuestions {
	constructor(config) {
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

	async preload(progress, cache) {
		progress(0, 1);
		this._quotes = await this._loadQuotes(cache, progress);
		progress(1, 1);
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

		let q = nlp(quote.text);

		let words = [q.adjectives(), q.verbs(), q.nouns()].filter(words => words.length > 0).flatMap(words => words.post('').map(word => word.text()));

		let word = selector.fromArray(words);
		
		let doc = nlp(quote.text);
		doc.match(word).replaceWith("_____");
		let maskedQuote = doc.text();

		return {
			text : maskedQuote,
			author : quote.author,
			word : word
		}
	}

	_similarAuthors(quote, selector) {
		return this._quotes;
	}

	_similarWords(quote, selector) {
		let q = nlp(quote.word);
		
		let verbs = q.verbs();
		let nouns = q.nouns();
		let adjectives = q.adjectives();

		let otherQuotes = "";
		for (var i = 0; i < 50; i++) {
			otherQuotes += this._randomQuote(selector).text + ".\n";
		}

		if (verbs.wordCount() > 0) {
			return this._similarVerbs(verbs.json()[0].terms[0].tags, nlp(otherQuotes).post('').verbs());
		} else if (nouns.wordCount() > 0) {
			return this._similarNouns(nouns.json()[0].terms[0].tags, nlp(otherQuotes).post('').nouns());
		} else {
			return this._similarAdjectives(adjectives.json()[0].terms[0].tags, nlp(otherQuotes).post('').adjectives());
		}
	}

	_similarVerbs(tags, otherVerbs) {
		return otherVerbs.map(verb => {
			if ('Infinitive' in tags) {
				verb = verb.toInfinitive();
			}
			if ('PastTense' in tags) {
				verb = verb.toPastTense();
			}
			if ('PresentTense' in tags) {
				verb = verb.toPresentTense();
			}
			if ('FutureTense' in tags) {
				verb = verb.toFutureTense();
			}
			if ('Gerund' in tags) {
				verb = verb.toGerund();
			}
			return verb.trim().text();
		}).map(word => ({ 'word'  : word }));
	}

	_similarNouns(tags, otherNouns) {
		return otherNouns.map(noun => {
			if ('Singular' in tags) {
				noun = noun.toSingular();
			}
			if ('Plural' in tags) {
				noun = noun.toPlural();
			}
			return noun.trim().text();
		}).map(word => ({ 'word'  : word }));
	}

	_similarAdjectives(tags, otherAdjectives) {
		return otherAdjectives.map(adjective => {
			if ('Superlative' in tags) {
				adjective = adjective.toSuperlative();
			}
			if ('Comparative' in tags) {
				adjective = adjective.toComparative();
			}
			return adjective.trim().text();
		}).map(word => ({ 'word'  : word }));
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
		return quotesy.parse_json();
	}
}

export default QuotesQuestions;