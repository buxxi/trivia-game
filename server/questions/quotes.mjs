import nlp from 'compromise';
import adjectives from 'compromise-adjectives';
import quotesy from 'quotesy';
import Questions from './questions.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

nlp.extend(adjectives);

class QuotesQuestions extends Questions {
	constructor(config, categoryName) {
		super(config, categoryName);
		this._quotes = [];
		this._addQuestion({
			title : () => this._translatable("question.author"),
			correct : (_) => this._randomQuote(),
			similar : (correct) => this._similarAuthors(correct),
			load : (correct) => this._loadQuote(correct),
			format : (answer, _) => this._resolveAuthor(answer),
			weight : 50
		});
		this._addQuestion({
			title : () => this._translatable("question.word"),
			correct : (_) => this._randomBlankQuote(),
			similar : (correct) => this._similarWords(correct),
			load : (correct) => this._loadQuote(correct),
			format : (answer, _) => this._formatWord(answer),
			weight : 50,
			available: (game) => game.language() === 'en'
		});
	}

	describe() {
		return {
			name : this._translatable("title"),
			icon : 'fa-quote-right',
			attribution : [
				{ url: 'https://github.com/dwyl/quotes', name: 'Quotesy' }
			]
		};
	}

	async preload(language, progress, cache) {
		progress(0, 1);
		this._quotes = await this._loadQuotes(cache, progress);
		progress(1, 1);
		return this._countQuestions();
	}

	_countQuestions() {
		return this._quotes.length * Object.keys(this._types).length;
	}

	_randomQuote() {
		return Random.fromArray(this._quotes);
	}

	_randomBlankQuote() {
		let quote = Random.fromArray(this._quotes);

		let q = nlp(quote.text);

		let words = [q.adjectives(), q.verbs(), q.nouns()].filter(words => words.length > 0).flatMap(words => words.post('').map(word => word.text()));

		let word = Random.fromArray(words);
		
		let doc = nlp(quote.text);
		doc.match(word).replaceWith("_____");
		let maskedQuote = doc.text();

		return {
			text : maskedQuote,
			author : quote.author,
			word : word
		}
	}

	_similarAuthors(quote) {
		return Generators.random(this._quotes);
	}

	_similarWords(quote) {
		let q = nlp(quote.word);
		
		let verbs = q.verbs();
		let nouns = q.nouns();
		let adjectives = q.adjectives();

		let otherQuotes = "";
		for (var i = 0; i < 50; i++) {
			otherQuotes += this._randomQuote().text + ".\n";
		}

		if (verbs.wordCount() > 0) {
			return Generators.random(this._similarVerbs(verbs.json()[0].terms[0].tags, nlp(otherQuotes).post('').verbs()));
		} else if (nouns.wordCount() > 0) {
			return Generators.random(this._similarNouns(nouns.json()[0].terms[0].tags, nlp(otherQuotes).post('').nouns()));
		} else {
			return Generators.random(this._similarAdjectives(adjectives.json()[0].terms[0].tags, nlp(otherQuotes).post('').adjectives()));
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
				title : this._translatable("attribution.quote"),
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