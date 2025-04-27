import Selector from '../selector.mjs';
import Questions from './questions.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

class CurrentGameQuestions extends Questions {
	constructor(config, categoryName) {
		super(config, categoryName);
		this._addQuestion({
			title : (correct) => "Which animal does " + correct.name + " have as avatar?",
			correct : (game) => this._randomPlayer(game),
			similar : (correct, game) => this._otherAvatars(correct, game),
			format : (correct) => this._resolveAvatar(correct),
			load : (correct) => this._loadBlankAvatar("Avatar", correct)
		});
		this._addQuestion({
			title : () => "Who has the most correct answers so far?",
			correct : (game) => this._playerWithMost(game, (p) => p.correctGuesses()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.correctGuesses()),
			format : (correct) => this._resolveName(correct),
			load : (correct) => this._loadBlankName("Most correct player (at that time)", correct)
		});
		this._addQuestion({
			title : () => "Who has the most incorrect answers so far?",
			correct : (game) => this._playerWithMost(game, (p) => p.wrongGuesses()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.wrongGuesses()),
			format : (correct) => this._resolveName(correct),
			load : (correct) => this._loadBlankName("Most incorrect player (at that time)", correct)
		});
		this._addQuestion({
			title : () => "What is the total amount of correct answers so far?",
			correct : (game) => this._countTotal(game, (p) => p.correctGuesses()),
			similar : (correct, game) => this._numericAlternatives(correct, game),
			format : (correct) => this._formatValue(correct),
			load : (correct) => this._loadBlankValue("Total correct answers (at that time)", correct)
		});
		this._addQuestion({
			title : () => "What is the total amount of incorrect answers so far?",
			correct : (game) => this._countTotal(game, (p) => p.wrongGuesses()),
			similar : (correct, game) => this._numericAlternatives(correct, game),
			format : (correct) => this._formatValue(correct),
			load : (correct) => this._loadBlankValue("Total incorrect answers (at that time)", correct)
		});
		this._addQuestion({
			title : () => "Who has made the fastest correct answers so far?",
			correct : (game) => this._playerWithLeast(game, (p) => p.fastestCorrectGuess()),
			similar : (correct, game) => this._playersWithHigher(correct, game, (p) => p.fastestCorrectGuess()),
			format : (correct) => this._resolveName(correct),
			load : (correct) => this._loadBlankName("Fastest player (at that time)", correct)
		});
		this._addQuestion({
			title : () => "Who has made the slowest correct answers so far?",
			correct : (game) => this._playerWithMost(game, (p) => p.slowestCorrectGuess()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.slowestCorrectGuess()),
			format : (correct) => this._resolveName(correct),
			load : (correct) => this._loadBlankName("Slowest player (at that time)", correct)
		});
	}

	describe() {
		return {
			name : 'Current Game',
			icon : 'fa-history',
			attribution : [
				{ url: 'https://github.com/buxxi/trivia-game', name: 'GitHub' }
			]
		};
	}

	async preload(language) {
		this._onlyEnglish(language);
		return this._countQuestions();
	}

	_loadBlankAvatar(title, correct) {
		return this._loadBlank(title, this._resolveAvatar(correct));
	}

	_loadBlankName(title, correct) {
		return this._loadBlank(title, this._resolveName(correct));
	}

	_loadBlankValue(title, correct) {
		return this._loadBlank(title, this._formatValue(correct));
	}

	_loadBlank(title, name) {
		return {
			attribution : {
				title : title,
				name : name,
				links : []
			}
		};		
	}

	_countQuestions() {
		return Object.keys(this._types).length;
	}

	_randomPlayer(game) {
		return Random.fromArray(this._players(game));
	}

	_playerWithMost(game, func) {
		return Selector.max(this._players(game), func);
	}

	_playersWithLower(player, game, func) {
		let result = this._players(game).filter((p) => func(p) < func(player));
		return Generators.random(result);
	}

	_playerWithLeast(game, func) {
		return Selector.min(this._players(game), func);
	}

	_playersWithHigher(player, game, func) {
		let result = this._players(game).filter((p) => func(p) > func(player));
		return Generators.random(result);
	}

	_countTotal(game, func) {
		return Selector.sum(this._players(game), func);
	}

	_numericAlternatives(number, game) {
		var index = game.currentQuestionIndex();
		return Generators.numeric(number, index);
	}

	_otherAvatars(player, game) {
		let result = game.avatars().map((a) => ({ avatar : a }));
		return Generators.random(result);
	}

	_resolveName(player) {
		return player.name;
	}

	_resolveAvatar(player) {
		return player.avatar.charAt(0).toUpperCase() + player.avatar.slice(1);
	}

	_formatValue(value) {
		return value;
	}

	_players(game) {
		return Object.values(game.players());
	}
}

export default CurrentGameQuestions;