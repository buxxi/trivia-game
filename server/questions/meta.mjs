import Selector from '../selector.mjs';
import Questions from './questions.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

class CurrentGameQuestions extends Questions {
	constructor(config, categoryName) {
		super(config, categoryName);
		this._addQuestion({
			title : (correct) => this._translatable("question.animal", {player: correct.name}),
			correct : (game) => this._randomPlayer(game),
			similar : (correct, game) => this._otherAvatars(correct, game),
			format : (answer, _) => this._resolveAvatar(answer),
			load : (correct) => this._loadBlankAvatar("attribution.avatar", correct)
		});
		this._addQuestion({
			title : (_) => this._translatable("question.most_correct"),
			correct : (game) => this._playerWithMost(game, (p) => p.correctGuesses()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.correctGuesses()),
			format : (answer, _) => this._resolveName(answer),
			load : (correct) => this._loadBlankName("attribution.most_correct", correct)
		});
		this._addQuestion({
			title : (_) => this._translatable("question.most_incorrect"),
			correct : (game) => this._playerWithMost(game, (p) => p.wrongGuesses()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.wrongGuesses()),
			format : (answer, _) => this._resolveName(answer),
			load : (correct) => this._loadBlankName("attribution.most_incorrect", correct)
		});
		this._addQuestion({
			title : (_) => this._translatable("question.total_correct"),
			correct : (game) => this._countTotal(game, (p) => p.correctGuesses()),
			similar : (correct, game) => this._numericAlternatives(correct, game),
			format : (answer, _) => this._formatValue(answer),
			load : (correct) => this._loadBlankValue("attribution.total_correct", correct)
		});
		this._addQuestion({
			title : (_) => this._translatable("question.total_incorrect"),
			correct : (game) => this._countTotal(game, (p) => p.wrongGuesses()),
			similar : (correct, game) => this._numericAlternatives(correct, game),
			format : (answer, _) => this._formatValue(answer),
			load : (correct) => this._loadBlankValue("attribution.total_incorrect", correct)
		});
		this._addQuestion({
			title : (_) => this._translatable("question.fastest_correct"),
			correct : (game) => this._playerWithLeast(game, (p) => p.fastestCorrectGuess()),
			similar : (correct, game) => this._playersWithHigher(correct, game, (p) => p.fastestCorrectGuess()),
			format : (answer, _) => this._resolveName(answer),
			load : (correct) => this._loadBlankName("attribution.fastest_correct", correct)
		});
		this._addQuestion({
			title : (_) => this._translatable("question.slowest_correct"),
			correct : (game) => this._playerWithMost(game, (p) => p.slowestCorrectGuess()),
			similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.slowestCorrectGuess()),
			format : (answer, _) => this._resolveName(answer),
			load : (correct) => this._loadBlankName("attribution.slowest_correct", correct)
		});
	}

	describe() {
		return {
			name : this._translatable("title"),
			icon : 'fa-history',
			attribution : [
				{ url: 'https://github.com/buxxi/trivia-game', name: 'GitHub' }
			]
		};
	}

	async preload(language) {
		return this._countQuestions();
	}

	_loadBlankAvatar(titleKey, correct) {
		return this._loadBlank(titleKey, this._resolveAvatar(correct));
	}

	_loadBlankName(titleKey, correct) {
		return this._loadBlank(titleKey, this._resolveName(correct));
	}

	_loadBlankValue(titleKey, correct) {
		return this._loadBlank(titleKey, this._formatValue(correct));
	}

	_loadBlank(titleKey, name) {
		return {
			attribution : {
				title : this._translatable(titleKey),
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
		return this._translatable(`avatar.${player.avatar}`);
	}

	_formatValue(value) {
		return value;
	}

	_players(game) {
		return Object.values(game.players());
	}
}

export default CurrentGameQuestions;