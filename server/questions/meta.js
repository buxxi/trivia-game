const avatars = require('../../js/avatars.js');

class CurrentGameQuestions {
	constructor() {
		this._types = {
			avatar : {
				title : (correct) => "What animal does " + correct.name + " have as avatar?",
				correct : (correct) => this._randomPlayer(correct),
				similar : (correct, selector) => this._otherAvatars(correct, selector),
				format : (correct) => this._resolveAvatar(correct),
				attribution : "Featured avatar"
			},
			correct : {
				title : (correct) => "Who has the most correct answers so far?",
				correct : (selector) => this._playerWithMost(selector, (p) => p.stats.correct),
				similar : (correct, selector) => this._playersWithLower(correct, selector, (p) => p.stats.correct),
				format : (correct) => this._resolveName(correct),
				attribution : "Most correct player"
			},
			wrong : {
				title : (correct) => "Who has the most incorrect answers so far?",
				correct : (selector) => this._playerWithMost(selector, (p) => p.stats.wrong),
				similar : (correct, selector) => this._playersWithLower(correct, selector, (p) => p.stats.wrong),
				format : (correct) => this._resolveName(correct),
				attribution : "Most incorrect player"
			},
			total_correct : {
				title : (correct) => "What is the total amount of correct answers so far?",
				correct : (selector) => this._countTotal(selector, (p) => p.stats.correct),
				similar : (correct, selector) => this._numericAlternatives(correct, selector),
				format : (correct) => this._formatValue(correct),
				attribution : "Total correct answers"
			},
			total_wrong : {
				title : (correct) => "What is the total amount of incorrect answers so far?",
				correct : (selector) => this._countTotal(selector, (p) => p.stats.wrong),
				similar : (correct, selector) => this._numericAlternatives(correct, selector),
				format : (correct) => this._formatValue(correct),
				attribution : "Total incorrect answers"
			},
			fastest : {
				title : (correct) => "Who has made the fastest correct answers so far?",
				correct : (selector) => this._playerWithMost(selector, (p) => p.stats.fastest),
				similar : (correct, selector) => this._playersWithLower(correct, selector, (p) => p.stats.fastest),
				format : (correct) => this._resolveName(correct),
				attribution : "Fastest player"
			},
			slowest : {
				title : (correct) => "Who has made the slowest correct answers so far?",
				correct : (selector) => this._playerWithLeast(selector, (p) => p.stats.slowest),
				similar : (correct, selector) => this._playersWithHigher(correct, selector, (p) => p.stats.slowest),
				format : (correct) => this._resolveName(correct),
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

	preload(progress, cache, game) {
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
				answers : selector.alternatives(type.similar(correct, selector), correct, type.format, (arr) => selector.splice(arr)),
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

	_playerWithMost(selector, func) {
		console.log(this._players().map(func));
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
		console.log(Object.keys(avatars));
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