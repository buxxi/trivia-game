class CurrentGameQuestions {
	constructor() {
		this._types = {
			avatar : {
				title : (correct) => "Which animal does " + correct.name + " have as avatar?",
				correct : (selector, game) => this._randomPlayer(selector, game),
				similar : (correct, game, selector) => this._otherAvatars(correct, game, selector),
				format : (correct) => this._resolveAvatar(correct),
				attribution : "Avatar"
			},
			correct : {
				title : (correct) => "Who has the most correct answers so far?",
				correct : (selector, game) => this._playerWithMost(selector, game, (p) => p.stats.correct),
				similar : (correct, game, selector) => this._playersWithLower(correct, game, selector, (p) => p.stats.correct),
				format : (correct) => this._resolveName(correct),
				attribution : "Most correct player (at that time)"
			},
			wrong : {
				title : (correct) => "Who has the most incorrect answers so far?",
				correct : (selector, game) => this._playerWithMost(selector, game, (p) => p.stats.wrong),
				similar : (correct, game, selector) => this._playersWithLower(correct, game, selector, (p) => p.stats.wrong),
				format : (correct) => this._resolveName(correct),
				attribution : "Most incorrect player (at that time)"
			},
			total_correct : {
				title : (correct) => "What is the total amount of correct answers so far?",
				correct : (selector, game) => this._countTotal(selector, game, (p) => p.stats.correct),
				similar : (correct, game, selector) => this._numericAlternatives(correct, game, selector),
				format : (correct) => this._formatValue(correct),
				attribution : "Total correct answers (at that time)"
			},
			total_wrong : {
				title : (correct) => "What is the total amount of incorrect answers so far?",
				correct : (selector, game) => this._countTotal(selector, game, (p) => p.stats.wrong),
				similar : (correct, game, selector) => this._numericAlternatives(correct, game, selector),
				format : (correct) => this._formatValue(correct),
				attribution : "Total incorrect answers (at that time)"
			},
			fastest : {
				title : (correct) => "Who has made the fastest correct answers so far?",
				correct : (selector, game) => this._playerWithLeast(selector, game, (p) => p.stats.fastest),
				similar : (correct, game, selector) => this._playersWithHigher(correct, game, selector, (p) => p.stats.fastest),
				format : (correct) => this._resolveName(correct),
				attribution : "Fastest player (at that time)"
			},
			slowest : {
				title : (correct) => "Who has made the slowest correct answers so far?",
				correct : (selector, game) => this._playerWithMost(selector, game, (p) => p.stats.slowest),
				similar : (correct, game, selector) => this._playersWithLower(correct, game, selector, (p) => p.stats.slowest),
				format : (correct) => this._resolveName(correct),
				attribution : "Slowest player (at that time)"
			}
		}
	}

	describe() {
		return {
			type : 'game',
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

	async nextQuestion(selector, game) {
		let type = selector.fromWeightedObject(this._types);
		let correct = type.correct(selector, game);

		return ({
			text : type.title(correct),
			answers : selector.alternatives(type.similar(correct, game, selector), correct, type.format, (arr) => selector.splice(arr)),
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

	_randomPlayer(selector, game) {
		return selector.fromArray(this._players(game));
	}

	_playerWithMost(selector, game, func) {
		return selector.max(this._players(game), func);
	}

	_playersWithLower(player, game, selector, func) {
		return this._players(game).filter((p) => func(p) < func(player));
	}

	_playerWithLeast(selector, game, func) {
		return selector.min(this._players(game), func);
	}

	_playersWithHigher(player, game, selector, func) {
		return this._players(game).filter((p) => func(p) > func(player));
	}

	_countTotal(selector, game, func) {
		return selector.sum(this._players(game), func);
	}

	_numericAlternatives(number, game, selector) {
		var index = game.currentQuestionIndex();
		return selector.numericAlternatives(number, index);
	}

	_otherAvatars(player, game, selector) {
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