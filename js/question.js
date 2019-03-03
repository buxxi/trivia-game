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

function QuestionController($scope, $location, connection, game, playback, sound, avatars, categories) {
	if (typeof(game.session().finished) != 'function') { //TODO: make a better check
		$location.path("/");
	}

	let app = new Vue({
		el: '.question',
		data: {
			spinner : {
				categories: []
			},
			timer: {
				running: false,
				score: 0,
				timeLeft: 0,
				percentageLeft: 0
			},
			players: mapToMap(game.players(), (player) => { return (
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
			avatars: avatars,
			crownUrl: /src=\"(.*?)\"/.exec(twemoji.parse("\uD83D\uDC51"))[1],
			error: undefined
		},
		computed: {
			showPlayerName: function() { return this.timer.timeLeft % 10 >= 5; },
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
	});

	$scope.$on("data-guess", (event, pairCode, data) => {
		game.guess(pairCode, data);
		app.players[pairCode].guessed = true;
		sound.beep(Object.values(app.players).filter((p) => p.guessed).length);
	});

	$scope.$on("connection-closed", (event, conn) => {
		for (pairCode in app.players) {
			app.players[pairCode].connectionError = connection.connectionErrors(pairCode);
		}
	});

	function showLoadingNextQuestion() {
		return new Promise((resolve, reject) => {
			var spinner = new CategorySpinner(categories, sound.click, game.showCategorySpinner());

			app.state = 'loading';
			app.title = 'Selecting next question';
			app.spinner.categories = spinner.categories;

			game.nextQuestion().then((question) => {
				updateSession(game.session());
				spinner.start().then(() => {
					sound.speak(app.session.currentCategory, () => resolve(question));
				}).catch(reject);
				setTimeout(() => spinner.stop().catch(reject), 2000);
			}).catch(reject);
		});
	}

	function showPreQuestion(question) {
		return new Promise((resolve, reject) => {
			app.state = 'pre-question';
			app.title = question.text;

			connection.send((peerid) => {
				return { stats : game.stats(peerid) };
			});

			var spoken = false;
			var timelimit = false;

			sound.speak(question.text, () => {
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
				let player = playback.player(question.view, question.answers);
				await player.start();

				app.state = 'question';
				app.minimizeQuestion = player.minimizeQuestion;

				await connection.send({
					answers : question.answers
				});

				let pointsThisRound = await game.startTimer(updateTimer);
				player.stop();
				app.timer.running = false;

				if (player.pauseMusic) {
					sound.pause();
				}

				resolve(pointsThisRound);
			} catch (e) {
				reject(e);
			}
		});
	}

	function showPostQuestion(pointsThisRound) {
		return new Promise((resolve, reject) => {
			sound.play();
			if (Object.values(pointsThisRound).some(p => p.multiplier <= -4)) {
				sound.trombone();
			}

			var correct = game.correctAnswer();
			document.getElementById('content').innerHTML = '';
			connection.send({
				correct : correct.key
			});

			app.title = "The correct answer was";
			app.correct = correct;
			app.state = 'post-question';
			updatePoints(pointsThisRound);

			setTimeout(() => {
				updatePoints({});
			
				connection.send({
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
		if (game.hasMoreQuestions()) {
			showLoadingNextQuestion().then(showPreQuestion).then(showQuestion).then(showPostQuestion).then(gameLoop).catch(showError);
		} else {
			$scope.$apply(() => {
				$location.path('/results');
			})
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
		for (pairCode in app.players) {
			let player = app.players[pairCode];
			player.pointChange = pairCode in pointChanges ? pointChanges[pairCode].points : 0;
			player.multiplier = pairCode in pointChanges ? pointChanges[pairCode].multiplier : 1;
			player.guessed = false;
			player.totalPoints = game.players()[pairCode].score;
		}
	}

	function mapToMap(input, mapFunction) {
		let result = {};
		for (let i in input) {
			result[i] = mapFunction(input[i]);
		}
		return result;
	}

	gameLoop();
}
