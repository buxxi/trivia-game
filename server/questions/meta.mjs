import Selector from '../selector.mjs';
import Questions from './questions.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';
import translation from "#translation";

class CurrentGameQuestions extends Questions {
	constructor(config, categoryName) {
		super(config, categoryName);
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.animal", {player: correct.name}),
			correct : (game) => this._randomPlayer(game),
			similar : (correct, game) => this._otherAvatars(correct, game),
			format : (correct, translator) => this._resolveAvatar(correct, translator),
			load : (correct, translator) => this._loadBlankAvatar("attribution.avatar", correct, translator)
		});
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.most_correct"),
			correct : (game) => this._playerWithMost(game, (p) => p.correctGuesses()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.correctGuesses()),
			format : (correct) => this._resolveName(correct),
			load : (correct, translator) => this._loadBlankName("attribution.most_correct", correct, translator)
		});
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.most_incorrect"),
			correct : (game) => this._playerWithMost(game, (p) => p.wrongGuesses()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.wrongGuesses()),
			format : (correct) => this._resolveName(correct),
			load : (correct, translator) => this._loadBlankName("attribution.most_incorrect", correct, translator)
		});
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.total_correct"),
			correct : (game) => this._countTotal(game, (p) => p.correctGuesses()),
			similar : (correct, game) => this._numericAlternatives(correct, game),
			format : (correct) => this._formatValue(correct),
			load : (correct, translator) => this._loadBlankValue("attribution.total_correct", correct, translator)
		});
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.total_incorrect"),
			correct : (game) => this._countTotal(game, (p) => p.wrongGuesses()),
			similar : (correct, game) => this._numericAlternatives(correct, game),
			format : (correct) => this._formatValue(correct),
			load : (correct, translator) => this._loadBlankValue("attribution.total_incorrect", correct, translator)
		});
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.fastest_correct"),
			correct : (game) => this._playerWithLeast(game, (p) => p.fastestCorrectGuess()),
			similar : (correct, game) => this._playersWithHigher(correct, game, (p) => p.fastestCorrectGuess()),
			format : (correct) => this._resolveName(correct),
			load : (correct, translator) => this._loadBlankName("attribution.fastest_correct", correct, translator)
		});
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.slowest_correct"),
			correct : (game) => this._playerWithMost(game, (p) => p.slowestCorrectGuess()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.slowestCorrectGuess()),
			format : (correct) => this._resolveName(correct),
			load : (correct, translator) => this._loadBlankName("attribution.slowest_correct", correct, translator)
		});
	}

	describe(language) {
		return {
			name : this._translator.to(language).translate('title'),
			icon : 'fa-history',
			attribution : [
				{ url: 'https://github.com/buxxi/trivia-game', name: 'GitHub' }
			]
		};
	}

	async preload(language) {
		return this._countQuestions();
	}

	_loadBlankAvatar(title, correct, translator) {
		return this._loadBlank(title, this._resolveAvatar(correct, translator), translator);
	}

	_loadBlankName(title, correct, translator) {
		return this._loadBlank(title, this._resolveName(correct), translator);
	}

	_loadBlankValue(title, correct, translator) {
		return this._loadBlank(title, this._formatValue(correct), translator);
	}

	_loadBlank(title, name, translator) {
		return {
			attribution : {
				title : translator.translate(title),
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

	_resolveAvatar(player, translator) {
		return translator.translate(`avatar.${player.avatar}`);
	}

	_formatValue(value) {
		return value;
	}

	_players(game) {
		return Object.values(game.players());
	}
}

export default CurrentGameQuestions;