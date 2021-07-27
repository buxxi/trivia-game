class CurrentGameQuestions {
	constructor() {
		this._types = {
			avatar : {
				title : (correct) => "Which animal does " + correct.name + " have as avatar?",
				correct : (correct) => this._randomPlayer(correct),
				similar : (correct, selector) => this._otherAvatars(correct, selector),
				format : (correct) => this._resolveAvatar(correct),
				attribution : "Avatar"
			},
			correct : {
				title : (correct) => "Who has the most correct answers so far?",
				correct : (selector) => this._playerWithMost(selector, (p) => p.stats.correct),
				similar : (correct, selector) => this._playersWithLower(correct, selector, (p) => p.stats.correct),
				format : (correct) => this._resolveName(correct),
				attribution : "Most correct player (at that time)"
			},
			wrong : {
				title : (correct) => "Who has the most incorrect answers so far?",
				correct : (selector) => this._playerWithMost(selector, (p) => p.stats.wrong),
				similar : (correct, selector) => this._playersWithLower(correct, selector, (p) => p.stats.wrong),
				format : (correct) => this._resolveName(correct),
				attribution : "Most incorrect player (at that time)"
			},
			total_correct : {
				title : (correct) => "What is the total amount of correct answers so far?",
				correct : (selector) => this._countTotal(selector, (p) => p.stats.correct),
				similar : (correct, selector) => this._numericAlternatives(correct, selector),
				format : (correct) => this._formatValue(correct),
				attribution : "Total correct answers (at that time)"
			},
			total_wrong : {
				title : (correct) => "What is the total amount of incorrect answers so far?",
				correct : (selector) => this._countTotal(selector, (p) => p.stats.wrong),
				similar : (correct, selector) => this._numericAlternatives(correct, selector),
				format : (correct) => this._formatValue(correct),
				attribution : "Total incorrect answers (at that time)"
			},
			fastest : {
				title : (correct) => "Who has made the fastest correct answers so far?",
				correct : (selector) => this._playerWithMost(selector, (p) => p.stats.fastest),
				similar : (correct, selector) => this._playersWithLower(correct, selector, (p) => p.stats.fastest),
				format : (correct) => this._resolveName(correct),
				attribution : "Fastest player (at that time)"
			},
			slowest : {
				title : (correct) => "Who has made the slowest correct answers so far?",
				correct : (selector) => this._playerWithLeast(selector, (p) => p.stats.slowest),
				similar : (correct, selector) => this._playersWithHigher(correct, selector, (p) => p.stats.slowest),
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

	async preload(progress, cache, game) {
		this._current_game = game; //This would make it have circular dependencies if put in constructor 
		return this._countQuestions();
	}

	async nextQuestion(selector) {
		let type = selector.fromWeightedObject(this._types);
		let correct = type.correct(selector);

		return ({
			text : type.title(correct),
			answers : selector.alternatives(type.similar(correct, selector), correct, type.format, (arr) => selector.splice(arr)),
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

	_randomPlayer(selector) {
		return selector.fromArray(this._players());
	}

	_playerWithMost(selector, func) {
		return selector.max(this._players(), func);
	}

	_playersWithLower(player, selector, func) {
		return this._players().filter((p) => func(p) < func(player));
	}

	_playerWithLeast(selector, func) {
		return selector.min(this._players(), func);
	}

	_playersWithHigher(player, selector, func) {
		return this._players().filter((p) => func(p) > func(player));
	}

	_countTotal(selector, func) {
		return selector.sum(this._players(), func);
	}

	_numericAlternatives(number, selector) {
		var index = this._current_game.session().index();
		return selector.numericAlternatives(number, index);
	}

	_otherAvatars(player, selector) {
		return this._current_game.avatars().map((a) => ({ avatar : a }));
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

	_players() {
		return Object.values(this._current_game.players());
	}
}

export default CurrentGameQuestions;