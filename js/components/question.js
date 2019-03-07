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
		timer: {
			running: false,
			score: 0,
			timeLeft: 0,
			percentageLeft: 0
		},
		players: mapToMap(this.game.players(), (player) => { return (
			{
				name : player.name,
				color : player.color,
				avatar : player.avatar,
				totalPoints : 0,
				pointChange : 0,
				multiplier : 1,
				guessed : false,
				connectionError : false
			}
		)}),
		session: {
			index : 0,
			total : 0,
			currentCategory : undefined
		},
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
			app.timer.running = timer.running();
			app.timer.score = timer.score();
			app.timer.timeLeft = timer.timeLeft();
			app.timer.percentageLeft = timer.percentageLeft();
		}
	
		function updateSession(session) {
			app.session.index = session.index();
			app.session.total = session.total();
			app.session.currentCategory = session.question().view.category.join(": ");
		}
	
		function updatePoints(pointChanges) {
			for (let pairCode in app.players) {
				let player = app.players[pairCode];
				player.pointChange = pairCode in pointChanges ? pointChanges[pairCode].points : 0;
				player.multiplier = pairCode in pointChanges ? pointChanges[pairCode].multiplier : 1;
				player.guessed = false;
				player.totalPoints = app.game.players()[pairCode].score;
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

