import randomColor from 'randomcolor';
import Timer from './timer.mjs';

class Player {
	constructor(name, color, avatar) {
		this.name = name;
		this.color = color;
		this.avatar = avatar;
		this.score = 0;
		this.multiplier = 1;
		this.guesses = [];
	}

	correctGuesses() {
		return this.guesses.filter(g => g.correct === true).length;
	}

	wrongGuesses() {
		return this.guesses.filter(g => g.correct === false).length;
	}

	fastestCorrectGuess() {
		return Math.min(...this.guesses.filter(g => g.correct === true).map(g => g.time));
	}

	slowestCorrectGuess() {
		return Math.max(...this.guesses.filter(g => g.correct === true).map(g => g.time));
	}

	mostPointsWon() {
		return Math.max(...this.guesses.map(g => g.points));
	}

	mostPointsLost() {
		return Math.abs(Math.min(...this.guesses.map(g => g.points)));
	}

	_reset() {
		this.score = 0;
		this.multiplier = 1;
		this.guesses = [];
	}

	_updateScore(timeScore, time, maxMultiplier, answer) {
		if (timeScore > 0) {
			let scored = timeScore * this.multiplier;
			this.guesses.push(new PlayerGuess(answer, true, time, scored, this.multiplier));
			this.score += scored;
			this.multiplier = Math.min(this.multiplier + 1, maxMultiplier);
		} else if (timeScore < 0) {
			let scored = this.score > Math.abs(timeScore) ? timeScore : -this.score;
			this.guesses.push(new PlayerGuess(answer, false, time, scored, this.multiplier));
			this.score = this.score += scored;
			this.multiplier = 1;
		} else {
			this.guesses.push(new PlayerGuess(null, null, null, 0, this.multiplier));
			this.multiplier = 1;
		}
	}
}

class PlayerGuess {
	constructor(guessed, correct, time, points, multiplier) {
		this.guessed = guessed;
		this.correct = correct;
		this.time = time;
		this.points = points;
		this.multiplier = multiplier;
	}
}

class Game {
	constructor(categories, avatars) {
		this._started = false;
		this._categories = categories;
		this._avatars = avatars;
		this._players = {};
		this._guesses = {};
		this._timer = {};
		this._config = {
			questions : 25,
			time : 30,
			pointsPerRound : 1000,
			stopOnAnswers : true,
			allowMultiplier : true,
			maxMultiplier : 5,
			saveStatistics: true,
			sound : {
				backgroundMusic : true,
				soundEffects : true,
				text2Speech : true
			},
			categories : {},
			fullscreen : false,
			categorySpinner : true,
			language: "en"
		};

		this._currentQuestion = {
			answers : {}
		};
		this._previousQuestions = [];
		this._totalQuestions = this._config.questions;
		this._enabledCategories = {};	
	}

	players() {
		return this._players;
	}

	config() {
		return this._config;
	}

	addPlayer(peerid, name, avatar) {
		name = name ? name.trim() : name;
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
		this._enabledCategories = Object.entries(this._config.categories).filter(([category, enabled]) => enabled).reduce((obj, [category, enabled]) => {
			obj[category] = {
				weight : 2
			};

			return obj;
		}, {});
		this._timer = new Timer(this._config.time, this._config.pointsPerRound);
		this._started = true;
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

	correctAnswer() {
		let question = this._currentQuestion;
		let correct = question.correct;
		return {
			key : Object.keys(question.answers).filter((key) => question.answers[key] == correct)[0],
			answer : correct
		}
	}

	history() {
		return this._previousQuestions;
	}

	currentQuestionIndex() {
		return this._previousQuestions.length + 1;
	}

	totalQuestionCount() {
		return this._config.questions;
	}

	currentCategory() {
		let name = this._currentQuestion.category.name;
		let subCategoryName = this._currentQuestion.view.category;
		return {
			name : name,
			fullName: name + (subCategoryName ? ": " + subCategoryName : "")
		};
	}

	categoryEnabled(category) {
		return category in this._enabledCategories;
	}

	startTimer(callback) {
		return this._timer.run(callback).then(() => {
			let pointsThisRound = this._calculatePoints();
			this._guesses = {};
			this._previousQuestions.push(this._currentQuestion);
			return pointsThisRound;
		});
	}

	hasMoreQuestions() {
		return this._previousQuestions.length < this.totalQuestionCount();
	}

	showCategorySpinner() {
		return this._config.categorySpinner;
	}

	async nextQuestion() {
		let question = await this._categories.nextQuestion(this, this._enabledCategories);
		
		this._checkDuplicateQuestion(question);
		this._currentQuestion = question;

		Object.values(this._enabledCategories).forEach((value) => { value.weight *= 2; });
		this._enabledCategories[this._currentQuestion.category.type].weight = 2;
		
		return question;
	}

	avatars() {
		return this._avatars;
	}

	language() {
		return this._config.language;
	}

	_calculatePoints() {
		var result = {};
		Object.keys(this._players).forEach((peerid) => {
			let player = this._players[peerid];
			let maxMultiplier = this._config.allowMultiplier ? this._config.maxMultiplier : 1;

			let scoreBefore = player.score;
			let multiplierBefore = player.multiplier;

			if (this._guesses[peerid]) {
				let timerScore = this._timer.score(this._guesses[peerid].time);
				let timeUsed = this._config.time - this._timer.timeLeft(this._guesses[peerid].time);
				let answer = this._guesses[peerid].answer;

				if (answer == this.correctAnswer()['key']) {
					player._updateScore(timerScore, timeUsed, maxMultiplier, answer);
				} else {
					player._updateScore(-timerScore, timeUsed, 1, answer);
				}
			} else {
				player._updateScore(0, 0, 1, null);
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

	_checkDuplicateQuestion(question) {
		let viewParams = ['url','videoId','mp3','quote'];
		this._previousQuestions.forEach((q) => {
			if (q.text === question.text && q.correct === question.correct && viewParams.every(p => q.view[p] === question.view[p])) {
				let params = JSON.stringify(Object.fromEntries(viewParams.map(p => [p, q.view[p]])));
				throw new Error("Duplicate question: '" + q.text + "', answer: '" + q.correct + "', params: " + params);
			}
		});
	}
}

export default Game;