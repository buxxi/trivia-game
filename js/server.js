var triviaApp = angular.module('triviaServer', ['ngRoute']);

triviaApp.config(($routeProvider) => {
	$routeProvider.when('/', {
			templateUrl : 'pages/lobby.html',
			controller  : 'lobbyController'
		}).when('/game', {
			templateUrl : 'pages/game-server.html',
			controller  : 'serverController'
		}).when('/results', {
			templateUrl : 'pages/results.html',
			controller : 'resultController'
		});
});

triviaApp.constant('avatars', {
	monkey : '\uD83D\uDC35',
	dog : '\uD83D\uDC36',
	wolf : '\uD83D\uDC3A',
	cat : '\uD83D\uDC31',
	lion : '\uD83E\uDD81',
	tiger : '\uD83D\uDC2F',
	horse : '\uD83D\uDC34',
	cow : '\uD83D\uDC2E',
	dragon : '\uD83D\uDC32',
	pig : '\uD83D\uDC37',
	mouse : '\uD83D\uDC2D',
	hamster : '\uD83D\uDC39',
	rabbit : '\uD83D\uDC30',
	bear : '\uD83D\uDC3B',
	panda : '\uD83D\uDC3C',
	frog : '\uD83D\uDC38',
	octopus : '\uD83D\uDC19'
});
triviaApp.run(($rootScope, avatars) => {
	Object.keys(avatars).forEach((avatar) => {
		avatars[avatar] = {
			code : avatars[avatar],
			url : /src=\"(.*?)\"/.exec(twemoji.parse(avatars[avatar]))[1]
		}
	});
	$rootScope.avatars = avatars;
});
triviaApp.constant('apikeys', {});
triviaApp.run(($http, apikeys) => {
	$http.get('js/api-keys.json').then((response) => {
		Object.keys(response.data).forEach((key) => {
			apikeys[key] = response.data[key];
		});
	});
});

triviaApp.controller('serverController', function($scope, $location, $timeout, connection, game, playback, sound, avatars) {
	$scope.timer = game.timer();
	$scope.players = game.players();
	$scope.session = game.session();
	$scope.title = "";
	$scope.pointChanges = {};
	$scope.state = "loading";
	$scope.hasGuessed = {};
	$scope.avatars = avatars;

	$scope.$on("data-guess", (event, pairCode, data) => {
		$scope.$apply(() => {
			game.guess(pairCode, data);
			$scope.hasGuessed[pairCode] = true;
			sound.beep(Object.keys($scope.hasGuessed).length);
		});
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
});
