function QuestionController($scope, $location, $timeout, connection, game, playback, sound, avatars) {
	$scope.timer = game.timer();
	$scope.players = game.players();
	$scope.session = game.session();
	$scope.title = "";
	$scope.pointChanges = {};
	$scope.state = "loading";
	$scope.hasGuessed = {};
	$scope.avatars = avatars;
	$scope.hasConnectionError = connection.connectionError;

	$scope.$on("data-guess", (event, pairCode, data) => {
		$scope.$apply(() => {
			game.guess(pairCode, data);
			$scope.hasGuessed[pairCode] = true;
			sound.beep(Object.keys($scope.hasGuessed).length);
		});
	});

	$scope.$on("connection-closed", (event, conn) => {
		$scope.$digest()
	});

	function showLoadingNextQuestion() {
		return new Promise((resolve, reject) => {
			$scope.state = 'loading';
			resolve();
		});
	}

	function showPreQuestion(question) {
		return new Promise((resolve, reject) => {
			$scope.$apply(() => {
				$scope.state = 'pre-question';
				$scope.title = question.text;
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

			var player = playback.player(question.view);
			player.start().then(() => {
				$scope.$apply(() => {
					$scope.state = 'question';
					$scope.category = question.view.category;
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
		showLoadingNextQuestion().then(() => {
			if (game.hasMoreQuestions()) {
				game.nextQuestion().then(showPreQuestion).then(showQuestion).then(showPostQuestion).then(gameLoop).catch(showError);
			} else {
				$scope.$apply(() => {
					$location.path('/results');
				})
			}
		});
	}

	gameLoop();
}
