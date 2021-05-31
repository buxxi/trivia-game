import CategorySpinner from '../spinner.js';
import PlaybackFactory from '../playback.js';

function showCategorySpinner(app, categories, correct, index, total) {
	app.state = 'loading';
	app.title = 'Selecting next question';
	app.session.update(index, total, correct);

	if (categories.length == 0) {
		return app.sound.speak(app.session.currentCategory.fullName, 3000);
	}

	let spinner = new CategorySpinner(() => app.sound.click());
	app.spinner.categories = categories;
	
	return new Promise((resolve, reject) => {
		spinner.start().then(() => {
			app.sound.speak(app.session.currentCategory.fullName, 3000).then(resolve);
		}).catch(reject);
		setTimeout(() => spinner.stop().catch(reject), 2000);
	});
}

async function displayQuestion(app, text) {
	app.state = 'pre-question';
	app.title = text;
	await app.sound.speak(text, 3000);
}

function displayError(app, message) {
	return new Promise((resolve, reject) => {
		app.error = message;
		setTimeout(() => {
			app.error = undefined;
			resolve();
		}, 3000);
	});
}

async function playbackStart(app, view, answers) {
	let player = app.playback.load(view, answers);

	await player.start();

	app.state = 'question';
	app.minimizeQuestion = player.minimizeQuestion;
	app.currentPlayer = player;

	if (player.pauseMusic) {
		app.sound.pause();
	}
}

function playbackEnd(app, pointsThisRound, correct) {
	return new Promise((resolve, reject) => {
		let player = app.currentPlayer;
		player.stop();
	
		app.timer.stop();
		app.sound.play();

		if (Object.values(pointsThisRound).some(p => p.multiplier <= -4)) {
			app.sound.trombone();
		}

		app.title = "The correct answer was";
		app.correct = correct;
		app.state = 'post-question';
		
		for (let playerId in pointsThisRound) {
			app.players[playerId].updatePoints(pointsThisRound[playerId]);
		}	

		setTimeout(() => {
			Object.values(app.players).forEach((player) => player.clearChanges());
			resolve();
		}, 3000);
	});
}

async function timerTicked(app, timeLeft, percentageLeft, currentScore) {
	app.timer.update(timeLeft, percentageLeft, currentScore);
}

async function playerGuessed(app, id) {
	app.players[id].guessed = true;
	app.sound.beep(Object.values(app.players).filter((p) => p.guessed).length);
}

async function playerConnected(app, newPlayers) {
	for (let id in app.players) {
		app.players[id].connected = (id in newPlayers);
	}
}

async function gameEnded(app, history, results) {
	app.connection.clearListeners();
	app.$router.push({ name: 'results', params: { gameId: app.gameId, results: results, history: history } });	
}

export default {
	data: function() { return({
		spinner : {
			categories: []
		},
		timer: new TimerData(),
		session: new SessionData(),
		title: '',
		state: 'loading',
		error: undefined,
		minimizeQuestion: false,
		playback: new PlaybackFactory(),
		players : {}
	})},
	props: ['gameId', 'connection', 'sound', 'passed', 'lobbyPlayers'],
	computed: {
		showPlayerName: function() { return this.timer.timeLeft % 10 >= 5; },
	},
	created: function() {
		if (!this.connection.connected()) {
			this.$router.push("/");
			return;
		}

		this.connection.onPlayersChange(newPlayers => {
			return playerConnected(this, newPlayers);
		});

		this.connection.onCategorySelect((categories, correct, index, total) => {
			return showCategorySpinner(this, categories, correct, index, total);
		});

		this.connection.onQuestion(text => {
			return displayQuestion(this, text);
		});

		this.connection.onQuestionError(message => {
			return displayError(this, message);
		});

		this.connection.onQuestionStart((view, answers) => {
			return playbackStart(this, view, answers);
		});

		this.connection.onQuestionEnd((pointsThisRound, correct) => {
			return playbackEnd(this, pointsThisRound, correct);
		});

		this.connection.onPlayerGuessed(id => {
			return playerGuessed(this, id);
		});

		this.connection.onTimerTick((timeLeft, percentageLeft, currentScore) => {
			return timerTicked(this, timeLeft, percentageLeft, currentScore);
		});

		this.connection.onGameEnd((history, results) => {
			return gameEnded(this, history, results);
		});

		for (let id in this.lobbyPlayers) {
			this.$set(this.players, id, new PlayerData(this.lobbyPlayers[id]));
		}
	},
	methods: {
		isLeadingPlayer: function (player) {
			let playerScoreCount = Object.values(this.players).filter((p) => p.totalPoints >= player.totalPoints).length;
			return playerScoreCount == 1;
		},
		achievedPoints: function (player) {
			return player.pointChange > 0;
		},
		lostPoints: function(player) {
			return player.pointChange < 0;
		},
		isCurrentCategory: function(category) {
			if (this.session.currentCategory) {
				return category.name == this.session.currentCategory.name;
			}
			return false;
		}
	}
};

class PlayerData {
	constructor(player) {
		this.name = player.name;
		this.color = player.color;
		this.avatar = player.avatar;
		this.totalPoints = 0;
		this.pointChange = 0;
		this.multiplier = 1;
		this.guessed = false;
		this.connected = true;
	}

	updatePoints(pointChanges) {
		this.pointChange = pointChanges.points;
		this.multiplier += pointChanges.multiplier;
		this.guessed = false;
		this.totalPoints += pointChanges.points;
	}

	clearChanges() {
		this.pointChange = 0;
	}
}

class SessionData {
	constructor() {
		this.index = 0;
		this.total = 0;
		this.currentCategory = undefined;
	}

	update(index, total, currentCategory) {
		this.index = index;
		this.total = total;
		this.currentCategory = currentCategory;
	}
}

class TimerData {
	constructor() {
		this.running = false;
		this.score = 0;
		this.timeLeft = 0;
		this.percentageLeft = 0;
	}
	
	update(timeLeft, percentageLeft, currentScore) {
		this.running = true;
		this.score = currentScore;
		this.timeLeft = timeLeft;
		this.percentageLeft = percentageLeft;
	}

	stop() {
		this.running = false;
	}
}