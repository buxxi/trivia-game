import Selector from '../selector.mjs';
import Questions from './questions.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

class CurrentGameQuestions extends Questions {
	constructor(config) {
		super();
		this._addQuestion({
			title : (correct) => "Which animal does " + correct.name + " have as avatar?",
			correct : (game) => this._randomPlayer(game),
			similar : (correct, game) => this._otherAvatars(correct, game),
			format : (correct) => this._resolveAvatar(correct),
			load : () => this._loadBlank("Avatar")
		});
		this._addQuestion({
			title : () => "Who has the most correct answers so far?",
			correct : (game) => this._playerWithMost(game, (p) => p.stats.correct),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.stats.correct),
			format : (correct) => this._resolveName(correct),
			load : () => this._loadBlank("Most correct player (at that time)")
		});
		this._addQuestion({
			title : () => "Who has the most incorrect answers so far?",
			correct : (game) => this._playerWithMost(game, (p) => p.stats.wrong),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.stats.wrong),
			format : (correct) => this._resolveName(correct),
			load : () => this._loadBlank("Most incorrect player (at that time)")
		});
		this._addQuestion({
			title : () => "What is the total amount of correct answers so far?",
			correct : (game) => this._countTotal(game, (p) => p.stats.correct),
			similar : (correct, game) => this._numericAlternatives(correct, game),
			format : (correct) => this._formatValue(correct),
			load : () => this._loadBlank("Total correct answers (at that time)")
		});
		this._addQuestion({
			title : () => "What is the total amount of incorrect answers so far?",
			correct : (game) => this._countTotal(game, (p) => p.stats.wrong),
			similar : (correct, game) => this._numericAlternatives(correct, game),
			format : (correct) => this._formatValue(correct),
			load : () => this._loadBlank("Total incorrect answers (at that time)")
		});
		this._addQuestion({
			title : () => "Who has made the fastest correct answers so far?",
			correct : (game) => this._playerWithLeast(game, (p) => p.stats.fastest),
			similar : (correct, game) => this._playersWithHigher(correct, game, (p) => p.stats.fastest),
			format : (correct) => this._resolveName(correct),
			load : () => this._loadBlank("Fastest player (at that time)")
		});
		this._addQuestion({
			title : () => "Who has made the slowest correct answers so far?",
			correct : (game) => this._playerWithMost(game, (p) => p.stats.slowest),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.stats.slowest),
			format : (correct) => this._resolveName(correct),
			load : () => this._loadBlank("Slowest player (at that time)")
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

	async preload() {
		return this._countQuestions();
	}

	_loadBlank(title) {
		return {
			attribution : {
				title : title,
				name : type.format(correct),
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