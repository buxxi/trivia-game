import QuestionSelector from '../selector.mjs';

class CurrentGameQuestions {
	constructor(config) {
		this._types = {
			avatar : {
				title : (correct) => "Which animal does " + correct.name + " have as avatar?",
				correct : (game) => this._randomPlayer(game),
				similar : (correct, game) => this._otherAvatars(correct, game),
				format : (correct) => this._resolveAvatar(correct),
				attribution : "Avatar"
			},
			correct : {
				title : (correct) => "Who has the most correct answers so far?",
				correct : (game) => this._playerWithMost(game, (p) => p.stats.correct),
				similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.stats.correct),
				format : (correct) => this._resolveName(correct),
				attribution : "Most correct player (at that time)"
			},
			wrong : {
				title : (correct) => "Who has the most incorrect answers so far?",
				correct : (game) => this._playerWithMost(game, (p) => p.stats.wrong),
				similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.stats.wrong),
				format : (correct) => this._resolveName(correct),
				attribution : "Most incorrect player (at that time)"
			},
			total_correct : {
				title : (correct) => "What is the total amount of correct answers so far?",
				correct : (game) => this._countTotal(game, (p) => p.stats.correct),
				similar : (correct, game) => this._numericAlternatives(correct, game),
				format : (correct) => this._formatValue(correct),
				attribution : "Total correct answers (at that time)"
			},
			total_wrong : {
				title : (correct) => "What is the total amount of incorrect answers so far?",
				correct : (game) => this._countTotal(game, (p) => p.stats.wrong),
				similar : (correct, game) => this._numericAlternatives(correct, game),
				format : (correct) => this._formatValue(correct),
				attribution : "Total incorrect answers (at that time)"
			},
			fastest : {
				title : (correct) => "Who has made the fastest correct answers so far?",
				correct : (game) => this._playerWithLeast(game, (p) => p.stats.fastest),
				similar : (correct, game) => this._playersWithHigher(correct, game, (p) => p.stats.fastest),
				format : (correct) => this._resolveName(correct),
				attribution : "Fastest player (at that time)"
			},
			slowest : {
				title : (correct) => "Who has made the slowest correct answers so far?",
				correct : (game) => this._playerWithMost(game, (p) => p.stats.slowest),
				similar : (correct, game) => this._playersWithLower(correct, game, (p) => p.stats.slowest),
				format : (correct) => this._resolveName(correct),
				attribution : "Slowest player (at that time)"
			}
		}
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

	async nextQuestion(game) {
		let type = QuestionSelector.fromWeightedObject(this._types);
		let correct = type.correct(game);

		return ({
			text : type.title(correct),
			answers : QuestionSelector.alternatives(type.similar(correct, game), correct, type.format, QuestionSelector.splice),
			correct : type.format(correct),
			view : {
				attribution : {
					title : type.attribution,
					name : type.format(correct),
					links : []
				}
			}
		});
	}

	_countQuestions() {
		return Object.keys(this._types).length;
	}

	_randomPlayer(game) {
		return QuestionSelector.fromArray(this._players(game));
	}

	_playerWithMost(game, func) {
		return QuestionSelector.max(this._players(game), func);
	}

	_playersWithLower(player, game, func) {
		return this._players(game).filter((p) => func(p) < func(player));
	}

	_playerWithLeast(game, func) {
		return QuestionSelector.min(this._players(game), func);
	}

	_playersWithHigher(player, game, func) {
		return this._players(game).filter((p) => func(p) > func(player));
	}

	_countTotal(game, func) {
		return QuestionSelector.sum(this._players(game), func);
	}

	_numericAlternatives(number, game) {
		var index = game.currentQuestionIndex();
		return QuestionSelector.numericAlternatives(number, index);
	}

	_otherAvatars(player, game) {
		return game.avatars().map((a) => ({ avatar : a }));
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