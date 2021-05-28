import CategorySpinner from '../spinner.js';

function showCategorySpinner(app, categories, correct, index, total) {
	//TODO: handle disabling of spinner
	let spinner = new CategorySpinner(() => app.sound.click());

	app.state = 'loading';
	app.title = 'Selecting next question';
	app.spinner.categories = categories;
	app.session.update(index, total, correct);

	return new Promise((resolve, reject) => {
		spinner.start().then(() => {
			app.sound.speak(app.session.currentCategory.fullName, 3000).then(resolve);
		}).catch(reject);
		setTimeout(() => spinner.stop().catch(reject), 2000);
	});
}

function displayQuestion(app, text) {
	return new Promise((resolve, reject) => {
		app.state = 'pre-question';
		app.title = text;
		app.sound.speak(text, 3000).then(resolve);
	});
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

function playbackStart(app, view, answers) {
	let player = app.playback.load(view, answers);
	
	return new Promise(async (resolve, reject) => {
		try {
			await player.start();
	
			app.state = 'question';
			app.minimizeQuestion = player.minimizeQuestion;
			app.currentPlayer = player;

			//TODO: handle pausing music

			resolve();
		} catch (e) {
			reject(e);
		}
	});
}

function playbackEnd(app, pointsThisRound, correct) {
	return new Promise((resolve, reject) => {
		let player = app.currentPlayer;
		player.stop();
	
		//TODO: Handle resuming music

		if (Object.values(pointsThisRound).some(p => p.multiplier <= -4)) {
			app.sound.trombone();
		}

		app.title = "The correct answer was";
		app.correct = correct;
		app.state = 'post-question';
		//TODO: show players changed points

		setTimeout(() => {
			// TODO: remove players changed points 
			resolve();
		}, 3000);
	});
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
		crownUrl: /src=\"(.*?)\"/.exec(twemoji.parse("\uD83D\uDC51"))[1],
		error: undefined,
		minimizeQuestion: false
	})},
	props: ['connection', 'playback', 'sound', 'passed', 'avatars', 'players'],
	computed: {
		showPlayerName: function() { return this.timer.timeLeft % 10 >= 5; },
	},
	created: function() {
		if (!this.connection.connected()) {
			this.$router.push("/");
			return;
		}

		/*
		app.connection.on("data-guess", (pairCode, data) => {
			app.game.guess(pairCode, data);
			app.players[pairCode].guessed = true;
			app.sound.beep(Object.values(app.players).filter((p) => p.guessed).length);
		});
	
		app.connection.on("connection-closed", (pairCode, data) => {
			for (pairCode in app.players) {
				app.players[pairCode].connectionError = connection.connectionErrors(pairCode);
			}
		});

		*/

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

		this.connection.onGameEnd(() => {
			return new Promise((resolve, reject) => {
				this.$router.push('/results');				
			});
		});
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
	
	update(timer) {
		this.running = timer.running();
		this.score = timer.score();
		this.timeLeft = timer.timeLeft();
		this.percentageLeft = timer.percentageLeft();
	}
}