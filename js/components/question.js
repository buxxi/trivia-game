function CategorySpinner(categories, flipCallback, show) {
	var self = this;

	var jokeChance = 0.5;
	var maxDuration = 2000;

	var duration = 50;
	var calcDuration = keepDuration;

	self.categories = loadCategories(categories);

	self.start = function() {
		return new Promise((resolve, reject) => {
			if (!show) {
				resolve();
				return;
			}

			var checkIfDone = () => {
				try {
					var done = self.flip();
					if (done) {
						document.querySelector(".spinner").classList.add('highlight');
						resolve();
					} else {
						setTimeout(checkIfDone, duration);
					}
				} catch (e) {
					reject(e);
				}
			}

			checkIfDone();
		});
	}

	self.flip = function() {
		flipCallback();

		duration = calcDuration(duration);
		var lis = document.querySelectorAll(".spinner li");
		for (var i = 0; i < lis.length; i++) {
			lis[i].style.transitionDuration = duration + "ms";
		}

		if (duration < maxDuration) {
			var li = lis[lis.length -1];
			var parent = li.parentNode;
			parent.removeChild(li);
			parent.insertBefore(li, parent.childNodes[0]);
			return false;
		} else {
			return true;
		}
	}

	self.stop = function() {
		return new Promise((resolve, reject) => {
			var stepsBeforeSlowingDown = calculateStepsBeforeSlowingDown();
			calcDuration = stepsDuration(stepsBeforeSlowingDown, logDuration);
			resolve();
		});
	}

	function loadCategories(categories) {
		if (!show) {
			return [];
		}
		var result = categories.enabled();
		var insertJoke = Math.random() >= jokeChance;
		while (result.length < 6 || insertJoke) {
			if (insertJoke) {
				result.push(categories.joke());
			}
			result = result.concat(categories.enabled()); //TODO: shuffle this array?
			insertJoke = Math.random() >= jokeChance;
		}
		return result;
	}

	function calculateStepsBeforeSlowingDown() {
		var steps = 0;
		var sum = duration;
		while (sum < maxDuration) {
			steps++;
			sum = logDuration(sum);
		}

		var indexOfChosen = -1;
		var lis = document.querySelectorAll(".spinner li");
		for (var i = 0; i < lis.length; i++) {
			if (lis[i].dataset.spinnerStop) {
				indexOfChosen = i;
			}
		}

		var mod = (n, m) => {
			return ((n % m) + m) % m;
		}

		var steps = (3 - steps) - indexOfChosen;
		return mod(steps, lis.length);
	}

	function logDuration(duration) {
		return Math.max(Math.log10(duration * 0.1),1.1) * duration
	}

	function keepDuration(duration) {
		return duration;
	}

	function stepsDuration(steps, nextDuration) {
		return (duration) => {
			if (steps == 0) {
				calcDuration = nextDuration;
			}
			steps--;
			return duration;
		}
	};
}

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

