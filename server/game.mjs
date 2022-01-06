import randomColor from 'randomcolor';
import Timer from './timer.mjs';

class Player {
	constructor(name, color, avatar) {
		this.name = name;
		this.color = color;
		this.avatar = avatar;
		this.score = 0;
		this.multiplier = 1;
		this.stats = new PlayerStats();
	}

	_reset() {
		this.score = 0;
		this.multiplier = 1;
		this.stats = new PlayerStats();
	}

	_updateScore(timeScore, time, maxMultiplier) {
		if (timeScore > 0) {
			this.score += timeScore * this.multiplier;
			this.multiplier = Math.min(this.multiplier + 1, maxMultiplier);
			this.stats.correct++;
			this.stats.fastest = Math.max(time, this.stats.fastest);
			this.stats.slowest = Math.min(time, this.stats.slowest);
			this.stats.mostWon = Math.max(timeScore, this.stats.mostWon);
		} else if (timeScore < 0) {
			this.score = Math.max(0, this.score + timeScore);
			this.multiplier = 1;
			this.stats.wrong++;
			this.stats.mostLost = Math.max(Math.abs(timeScore), this.stats.mostLost);
		} else {
			this.multiplier = 1;
		}
	}
}

class PlayerStats {
	constructor() {
		this.correct = 0;
		this.wrong = 0;
		this.fastest = -Infinity;
		this.slowest = Infinity;
		this.mostWon = 0;
		this.mostLost = 0;
	}
}

class Game {
	constructor(categories, avatars) {
		this._started = false;
		this._categories = categories;
		this._avatars = avatars;
		this._players = {};
		this._guesses = {};
		this._session = { history : () => [] };
		this._timer = {};
		this._config = {
			questions : 25,
			time : 30,
			pointsPerRound : 1000,
			stopOnAnswers : true,
			allowMultiplier : true,
			maxMultiplier : 5,
			sound : {
				backgroundMusic : true,
				soundEffects : true,
				text2Speech : true
			},
			categories : {},
			fullscreen : false,
			categorySpinner : true
		};
	}

	players() {
		return this._players;
	}

	config() {
		return this._config;
	}

	addPlayer(peerid, name, avatar) {
		if (!name) {
			throw new Error("Invalid name " + name);
		}
		if (this._started) {
			throw new Error("Game has already started");
		}
		let uniqueName = Object.values(this._players).map((player) => player.name).indexOf(name) == -1;
		if (!uniqueName) {
			throw new Error("The name " + name + " is already in use");
		}

		let color = randomColor({ luminosity: 'dark' });
		this._players[peerid] = new Player(name, color, this._selectAvatar(avatar));
	}

	removePlayer(peerid) {
		if (this._started) {
			throw new Error("Can't remove players once the game has started");
		}
		delete this._players[peerid];
	}

	start(config) {
		Object.assign(this._config, config);
		Object.values(this._players).forEach((player) => player._reset());
		this._session = new Session(this._config.questions, this._config.categories);
		this._timer = new Timer(this._config.time, this._config.pointsPerRound);
		this._started = true;
	}

	hasGuessed(peerid) {
		return this._guesses[peerid];
	}

	guess(peerid, answer) {
		if (this._guesses[peerid]) {
			throw new Error("Has already guessed!");
		}
		if (!this._timer.running()) {
			throw new Error("Game isn't accepting answers at this moment");
		}
		this._guesses[peerid] = {
			answer : answer,
			time : new Date().getTime()
		};
		if (Object.keys(this._guesses).length == Object.keys(this._players).length && this._config.stopOnAnswers) {
			this._timer.stop();
		}
	}

	stats(peerid) {
		let player = this._players[peerid];
		return {
			name : player.name,
			avatar : player.avatar,
			color : player.color,
			score : player.score,
			multiplier : player.multiplier
		};
	}

	correctAnswer() {
		let question = this._session.question();
		let correct = question.correct;
		return {
			key : Object.keys(question.answers).filter((key) => question.answers[key] == correct)[0],
			answer : correct
		}
	}

	history() {
		return this._session.history();
	}

	currentQuestionIndex() {
		return this._session.index();
	}

	totalQuestionCount() {
		return this._session.total();
	}

	currentCategory() {
		return this._session.category();
	}

	categoryEnabled(category) {
		return this._session.categoryEnabled(category);
	}

	nextCategory(selector) {
		return this._session.nextCategory(selector);
	}

	newQuestion(category, question) {
		return this._session.newQuestion(category, question);
	}

	startTimer(callback) {
		return this._timer.run(callback).then(() => {
			let pointsThisRound = this._calculatePoints();
			this._guesses = {};
			this._session.endQuestion();
			return pointsThisRound;
		});
	}

	hasMoreQuestions() {
		return this._session.finished();
	}

	showCategorySpinner() {
		return this._config.categorySpinner;
	}

	async nextQuestion() {
		let question = await this._categories.nextQuestion(this, this._session._enabledCategories);
		this._session.newQuestion(question);
		return question;
	}

	avatars() {
		return this._avatars;
	}

	_calculatePoints() {
		var result = {};
		Object.keys(this._players).forEach((peerid) => {
			let player = this._players[peerid];
			let maxMultiplier = this._config.allowMultiplier ? this._config.maxMultiplier : 1;

			let scoreBefore = player.score;
			let multiplierBefore = player.multiplier;

			if (this.hasGuessed(peerid)) {
				let timerScore = this._timer.score(this._guesses[peerid].time);
				let timeLeft = this._timer.timeLeft(this._guesses[peerid].time);
				
				if (this._guesses[peerid].answer == this.correctAnswer()['key']) {
					player._updateScore(timerScore, timeLeft, maxMultiplier);
				} else {
					player._updateScore(-timerScore, timeLeft, 1);
				}
			} else {
				player._updateScore(0, 0, 1);
			}

			result[peerid] = { points: player.score - scoreBefore, multiplier: player.multiplier - multiplierBefore }; 
		});
		return result;
	}

	_selectAvatar(preferred) {
		let unusedAvatars = this._avatars.filter((avatar) => {
			return Object.values(this._players).map((player) => {
				return player.avatar;
			}).indexOf(avatar) == -1;
		});
		if (unusedAvatars.indexOf(preferred) > -1) {
			return preferred;
		}
		return unusedAvatars[unusedAvatars.length * Math.random() << 0];
	}
}

class Session {
	constructor(totalQuestions, enabledCategories) {
		this._currentQuestion = {
			answers : {}
		};
		this._previousQuestions = [];
		this._totalQuestions = totalQuestions;

		this._enabledCategories = Object.entries(enabledCategories).filter(([category, enabled]) => enabled).reduce((obj, [category, enabled]) => {
			obj[category] = {
				weight : 2
			};

			return obj;
		}, {});	
	}

	index() {
		return this._previousQuestions.length + 1;
	}

	total() {
		return this._totalQuestions;
	}

	categoryEnabled(category) {
		return category in this._enabledCategories;
	}

	newQuestion(question) {
		let viewParams = ['url','videoId','mp3','quote'];
		this._previousQuestions.forEach((q) => {
			if (q.text === question.text && q.correct === question.correct && viewParams.every(p => q.view[p] === question.view[p])) {
				let params = JSON.stringify(Object.fromEntries(viewParams.map(p => [p, q.view[p]])));
				throw new Error("Duplicate question: '" + q.text + "', answer: '" + q.correct + "', params: " + params);
			}
		});
		this._currentQuestion = question;

		Object.values(this._enabledCategories).forEach((value) => { value.weight *= 2; });
		this._enabledCategories[this._currentQuestion.category.type].weight = 2;
	}

	endQuestion() {
		this._previousQuestions.push(this._currentQuestion);
	}

	finished() {
		return this._previousQuestions.length < this._totalQuestions;
	}

	history() {
		return this._previousQuestions;
	}

	question() {
		return this._currentQuestion;
	}

	category() {
		let name = this._currentQuestion.category.name;
		let subCategoryName = this._currentQuestion.view.category;
		return {
			name : name,
			fullName: name + (subCategoryName ? ": " + subCategoryName : "")
		};
	}
}

export default Game;