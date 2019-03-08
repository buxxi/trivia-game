import CategorySpinner from '../spinner.js';

function mapToMap(input, mapFunction) {
	let result = {};
	for (let i in input) {
		result[i] = mapFunction(input[i]);
	}
	return result;
}

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
	
		function showLoadingNextQuestion() {
			return new Promise((resolve, reject) => {
				let spinner = new CategorySpinner(app.categories, app.sound.click, app.game.showCategorySpinner());
	
				app.state = 'loading';
				app.title = 'Selecting next question';
				app.spinner.categories = spinner.categories;
	
				app.game.nextQuestion().then((question) => {
					updateSession(app.game.session());
					spinner.start().then(() => {
						app.sound.speak(app.session.currentCategory, () => resolve(question));
					}).catch(reject);
					setTimeout(() => spinner.stop().catch(reject), 2000);
				}).catch(reject);
			});
		}
	
		function showPreQuestion(question) {
			return new Promise((resolve, reject) => {
				app.state = 'pre-question';
				app.title = question.text;
	
				app.connection.send((peerid) => {
					return { stats : app.game.stats(peerid) };
				});
	
				var spoken = false;
				var timelimit = false;
	
				app.sound.speak(question.text, () => {
					spoken = true;
					if (timelimit) {
						resolve(question);
					}
				});
				setTimeout(() => {
					timelimit = true;
					if (spoken) {
						resolve(question);
					}
				}, 3000);
			});
		}
	
		function showQuestion(question) {
			return new Promise(async (resolve, reject) => {
				console.log(question);
	
				try {
					let player = app.playback.player(question.view, question.answers);
					await player.start();
	
					app.state = 'question';
					app.minimizeQuestion = player.minimizeQuestion;
	
					await app.connection.send({
						answers : question.answers
					});
	
					let pointsThisRound = await app.game.startTimer(updateTimer);
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
	
		function showPostQuestion(pointsThisRound) {
			return new Promise((resolve, reject) => {
				app.sound.play();
				if (Object.values(pointsThisRound).some(p => p.multiplier <= -4)) {
					app.sound.trombone();
				}
	
				let correct = app.game.correctAnswer();
				document.getElementById('content').innerHTML = '';
				app.connection.send({
					correct : correct.key
				});
	
				app.title = "The correct answer was";
				app.correct = correct;
				app.state = 'post-question';
				updatePoints(pointsThisRound);
	
				setTimeout(() => {
					updatePoints({});
				
					app.connection.send({
						wait : {}
					});
	
					resolve();
				}, 3000);
			});
		}
	
		function showError(err) {
			console.log(err);
	
			app.error = err.toString();
	
			setTimeout(() => {
				app.error = undefined;
				gameLoop();
			}, 3000);
		}
	
		function gameLoop() {
			if (app.game.hasMoreQuestions()) {
				showLoadingNextQuestion().then(showPreQuestion).then(showQuestion).then(showPostQuestion).then(gameLoop).catch(showError);
			} else {
				app.$router.push('/results');
			}
		}
	
		function updateTimer(timer) {
			app.timer.update(timer);
		}
	
		function updateSession(session) {
			app.session.update(session);
		}
	
		function updatePoints(pointChanges) {
			for (let pairCode in app.players) {
				let player = app.players[pairCode];
				player.updatePoints(pointChanges[pairCode], app.game.players()[pairCode].score);
			}
		}
	
		gameLoop();
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