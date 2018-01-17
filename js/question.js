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

function QuestionController($scope, $location, $timeout, connection, game, playback, sound, avatars, categories) {
	if (typeof(game.session().finished) != 'function') { //TODO: make a better check
		$location.path("/");
	}

	$scope.timer = game.timer();
	$scope.players = game.players();
	$scope.session = game.session();
	$scope.title = "";
	$scope.pointChanges = {};
	$scope.state = "loading";
	$scope.hasGuessed = {};
	$scope.avatars = avatars;
	$scope.crownUrl = /src=\"(.*?)\"/.exec(twemoji.parse("\uD83D\uDC51"))[1];
	$scope.hasConnectionError = connection.connectionError;
	$scope.showPlayerName = (player) => game.timer().timeLeft() % 10 >= 5;
	$scope.isLeadingPlayer = (player) => {
		var playerScoreCount = Object.values($scope.players).filter((p) => p.score >= player.score).length;
		return playerScoreCount == 1;
	}

	$scope.$on("data-guess", (event, pairCode, data) => {
		$scope.$apply(() => {
			game.guess(pairCode, data);
			$scope.hasGuessed[pairCode] = true;
			sound.beep(Object.keys($scope.hasGuessed).length);
		});
	});

	$scope.$on("connection-closed", (event, conn) => {
		$scope.$digest();
	});

	function showLoadingNextQuestion() {
		return new Promise((resolve, reject) => {
			var spinner = new CategorySpinner(categories, sound.click, game.showCategorySpinner());

			$scope.state = 'loading';
			$scope.title = 'Selecting next question';
			$scope.categories = spinner.categories;

			game.nextQuestion().then((question) => {
				$scope.$digest();
				spinner.start().then(() => {
					sound.speak(game.session().question().view.category.join(": "), () => resolve(question));
				}).catch(reject);
				setTimeout(() => spinner.stop().catch(reject), 2000);
			}).catch(reject);
		});
	}

	function showPreQuestion(question) {
		return new Promise((resolve, reject) => {
			$scope.$apply(() => {
				$scope.state = 'pre-question';
				$scope.title = question.text;
			});

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
			$timeout(() => {
				timelimit = true;
				if (spoken) {
					resolve(question);
				}
			}, 3000);
		});
	}

	function showQuestion(question) {
		return new Promise((resolve, reject) => {
			console.log(question);

			var player = playback.player(question.view, question.answers);
			player.start().then(() => {
				$scope.$apply(() => {
					$scope.state = 'question';
					$scope.category = question.view.category.join(": ");
					$scope.minimizeQuestion = player.minimizeQuestion;
				});

				connection.send({
					answers : question.answers
				});

				game.startTimer().then((pointsThisRound) => {
					player.stop();
					return resolve(pointsThisRound);
				});
				if (player.pauseMusic) {
					sound.pause();
				}
			}).catch(reject);
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
			$scope.$apply(() => {
				$scope.title = "The correct answer was";
				$scope.correct = correct;
				$scope.state = 'post-question';
				$scope.pointChanges = pointsThisRound;
				$scope.hasGuessed = {};
			});
			$timeout(() => {
				$scope.$apply(() => {
					$scope.pointChanges = {};
				})
				connection.send({
					wait : {}
				});
				resolve();
			}, 3000);
		});
	}

	function showError(err) {
		console.log(err);
		$scope.$apply(() => {
			$scope.error = err.toString();
		});
		$timeout(() => {
			delete $scope.error;
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

	gameLoop();
}
