const avatars = require('../../js/avatars.js');

class CurrentGameQuestions {
	constructor() {
		this._types = {
			avatar : {
				title : (correct) => "What animal does " + correct.name + " have as avatar?",
				correct : this._randomPlayer,
				similar : this._otherAvatars,
				format : this._resolveAvatar,
				attribution : "Featured avatar"
			},
			correct : {
				title : (correct) => "Who has the most correct answers so far?",
				correct : this._playerWithMost((p) => p.stats.correct),
				similar : this._playersWithLower((p) => p.stats.correct),
				format : this._resolveName,
				attribution : "Most correct player"
			},
			wrong : {
				title : (correct) => "Who has the most incorrect answers so far?",
				correct : this._playerWithMost((p) => p.stats.wrong),
				similar : this._playersWithLower((p) => p.stats.wrong),
				format : this._resolveName,
				attribution : "Most incorrect player"
			},
			total_correct : {
				title : (correct) => "What is the total amount of correct answers so far?",
				correct : this._countTotal((p) => p.stats.correct),
				similar : this._numericAlternatives,
				format : this._formatValue,
				attribution : "Total correct answers"
			},
			total_wrong : {
				title : (correct) => "What is the total amount of incorrect answers so far?",
				correct : this._countTotal((p) => p.stats.wrong),
				similar : this._numericAlternatives,
				format : this._formatValue,
				attribution : "Total incorrect answers"
			},
			fastest : {
				title : (correct) => "Who has made the fastest correct answers so far?",
				correct : this._playerWithMost((p) => p.stats.fastest),
				similar : this._playersWithLower((p) => p.stats.fastest),
				format : this._resolveName,
				attribution : "Fastest player"
			},
			slowest : {
				title : (correct) => "Who has made the slowest correct answers so far?",
				correct : this._playerWithLeast((p) => p.stats.slowest),
				similar : this._playersWithHigher((p) => p.stats.slowest),
				format : this._resolveName,
				attribution : "Slowest player"
			}
		}
	}

	describe() {
		return {
			type : 'game',
			name : 'Current Game',
			icon : 'fa-history',
			attribution : [
				{ url: 'https://github.com/buxxi/webrtc-trivia', name: 'GitHub' }
			],
			count : Object.keys(this._types).length
		};
	}

	preload(progress, cache, apikeys, game) {
		return new Promise((resolve, reject) => {
			this._current_game = game; //This would make it have circular dependencies if put in constructor 
			resolve();
		});
	}

	nextQuestion(selector) {
		return new Promise((resolve, reject) => {
			let type = selector.fromWeightedObject(this._types);
			let correct = type.correct(selector);

			resolve({
				text : type.title(correct),
				answers : selector.alternatives(type.similar(correct, selector), correct, type.format, selector.splice),
				correct : type.format(correct),
				view : {
					attribution : {
						title : type.attribution + " (at that time)",
						name : type.format(correct),
						links : []
					}
				}
			});
		});
	}

	_randomPlayer(selector) {
		return selector.fromArray(this._players());
	}

	_playerWithMost(func) {
		return (selector) => {
			return selector.max(this._players(), func);
		};
	}

	_playersWithLower(func) {
		return (player, selector) => {
			return this._players().filter((p) => func(p) < func(player));
		};
	}

	_playerWithLeast(func) {
		return (selector) => {
			return selector.min(this._players(), func);
		};
	}

	_playersWithHigher(func) {
		return (player, selector) => {
			return this._players().filter((p) => func(p) > func(player));
		};
	}

	_countTotal(func) {
		return (selector) => {
			return selector.sum(this._players(), func);
		};
	}

	_numericAlternatives(number, selector) {
		var index = this._current_game.session().index();
		return selector.numericAlternatives(number, index);
	}

	_otherAvatars(player, selector) {
		return Object.keys(avatars).map((a) => ({ avatar : a }));
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

module.exports = CurrentGameQuestions;