import CategorySpinner from '../spinner.js';

export default {
	data: function() { return({
		spinner : {
			categories: []
		},
		timer: new TimerData(),
		players: mapToMap(this.game.players(), (player) => new PlayerData(player)),
		session: new SessionData(),
		title: '',
		state: 'loading',
		crownUrl: /src=\"(.*?)\"/.exec(twemoji.parse("\uD83D\uDC51"))[1],
		error: undefined
	})},
	props: ['connection', 'game', 'playback', 'sound', 'avatars', 'categories'],
	computed: {
		showPlayerName: function() { return this.timer.timeLeft % 10 >= 5; },
	},
	created: function() {
		let app = this;

		if (typeof(this.game.session().finished) != 'function') { //TODO: make a better check
			app.$router.push("/");
		}

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

		new GameLoop(app).run().then(() => {
			app.$router.push('/results');
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
		}
	}
};

function mapToMap(input, mapFunction) {
	let result = {};
	for (let i in input) {
		result[i] = mapFunction(input[i]);
	}
	return result;
}

class LoadingNextQuestion {
	constructor(app) {
		this.app = app;
	}

	run() {
		return new Promise((resolve, reject) => {
			let app = this.app;
			let spinner = new CategorySpinner(app.categories, app.sound.click, app.game.showCategorySpinner());

			app.state = 'loading';
			app.title = 'Selecting next question';
			app.spinner.categories = spinner.categories;

			app.game.nextQuestion().then((question) => {
				app.session.update(app.game.session());
				spinner.start().then(() => {
					app.sound.speak(app.session.currentCategory, () => resolve(question));
				}).catch(reject);
				setTimeout(() => spinner.stop().catch(reject), 2000);
			}).catch(reject);
		});
	}

	nextState(question) {
		return new PreQuestion(this.app, question);
	}
}

class PreQuestion {
	constructor(app, question) {
		this.app = app;
		this.question = question;
	}

	run() {
		return new Promise((resolve, reject) => {
			let app = this.app;
			app.state = 'pre-question';
			app.title = this.question.text;

			app.connection.send((peerid) => {
				return { stats : app.game.stats(peerid) };
			});

			var spoken = false;
			var timelimit = false;

			app.sound.speak(this.question.text, () => {
				spoken = true;
				if (timelimit) {
					resolve(this.question);
				}
			});
			setTimeout(() => {
				timelimit = true;
				if (spoken) {
					resolve(this.question);
				}
			}, 3000);
		});
	}

	nextState(question) {
		return new ShowQuestion(this.app, question);
	}
}

class ShowQuestion {
	constructor(app, question) {
		this.app = app;
		this.question = question;
	}

	run() {
		return new Promise(async (resolve, reject) => {
			let app = this.app;

			console.log(this.question);

			try {
				let player = app.playback.player(this.question.view, this.question.answers);
				await player.start();

				app.state = 'question';
				app.minimizeQuestion = player.minimizeQuestion;

				await app.connection.send({
					answers : this.question.answers
				});

				let pointsThisRound = await app.game.startTimer((timer) => app.timer.update(timer));
				player.stop();
				app.timer.running = false;

				if (player.pauseMusic) {
					app.sound.pause();
				}

				resolve(pointsThisRound);
			} catch (e) {
				reject(e);
			}
		});
	}

	nextState(pointsThisRound) {
		return new PostQuestion(this.app, pointsThisRound);
	}
}

class PostQuestion {
	constructor(app, pointsThisRound) {
		this.app = app;
		this.pointsThisRound = pointsThisRound;
	}

	run() {
		function updatePoints(app, pointChanges) {
			for (let pairCode in app.players) {
				let player = app.players[pairCode];
				player.updatePoints(pointChanges[pairCode], app.game.players()[pairCode].score);
			}
		}

		return new Promise((resolve, reject) => {
			let app = this.app;
			app.sound.play();
			if (Object.values(this.pointsThisRound).some(p => p.multiplier <= -4)) {
				app.sound.trombone();
			}

			let correct = this.app.game.correctAnswer();
			document.getElementById('content').innerHTML = '';
			app.connection.send({
				correct : correct.key
			});

			app.title = "The correct answer was";
			app.correct = correct;
			app.state = 'post-question';
			updatePoints(app, this.pointsThisRound);

			setTimeout(() => {
				updatePoints(app, {});
			
				app.connection.send({
					wait : {}
				});

				resolve();
			}, 3000);
		});
	}

	nextState() {
		return false;
	}
}

class QuestionError {
	constructor(app, err) {
		this.app = app;
		this.err = err;
	}

	run() {
		return new Promise((resolve, reject) => {
			console.log(this.err);

			this.app.error = this.err.toString();

			setTimeout(() => {
				this.app.error = undefined;
				resolve();
			}, 3000);
		});
	}

	nextState() {
		return false;
	}
}

class GameLoop {
	constructor(app) {
		this.app = app;
	}

	run() {
		return new Promise(async (resolve, reject) => {
			var state;
			while (this.app.game.hasMoreQuestions()) {
				try {
					state = new LoadingNextQuestion(this.app);
					while (state) {
						let result = await state.run();
						state = state.nextState(result);
					}
				} catch (e) {
					state = new QuestionError(this.app, e);
					await state.run();
				}
			}
			resolve();
		});
	}
}

class SessionData {
	constructor() {
		this.index = 0;
		this.total = 0;
		this.currentCategory = undefined;
	}

	update(session) {
		this.index = session.index();
		this.total = session.total();
		this.currentCategory = session.question().view.category.join(": ");
	}
}

class PlayerData {
	constructor(player) {
		this.name = player.name;
		this.color = player.color;
		this.avatar = player.avatar;
		this.totalPoints = 0;
		this.pointChange = 0;
		this.multiplier = 1;
		this.guessed = false;
		this.connectionError = false;
	}

	updatePoints(pointChanges, totalPoints) {
		this.pointChange = pointChanges ? pointChanges.points : 0;
		this.multiplier = pointChanges ? pointChanges.multiplier : 1;
		this.guessed = false;
		this.totalPoints = totalPoints;
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