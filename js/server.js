var triviaApp = angular.module('triviaServer', ['ngRoute']);

triviaApp.config(function($routeProvider) {
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

triviaApp.constant('apikeys', {});
triviaApp.run(function($http, apikeys) {
	$http.get('js/api-keys.json').then(function(response) {
		Object.keys(response.data).forEach(function(key) {
			apikeys[key] = response.data[key];
		});
	});
});

triviaApp.service('sound', function() {
	function BackgroundMusic() {
		var self = this;
		var enabled = false;

		var sound = new Pizzicato.Sound('sound/background.mp3', function() {
			sound.volume = 0.10;
			sound.loop = true;
		});

		self.play = function() {
			if (!enabled) {
				return;
			}
			sound.play();
		}

		self.pause = function() {
			if (!enabled) {
				return;
			}
			sound.pause();
		}

		self.toggle = function(enable) {
			if (enable) {
				sound.play();
				enabled = true;
			} else {
				sound.pause();
				enabled = false;
			}
		}

		self.beep = function(count) {
			var beep = new Pizzicato.Sound('sound/beep.mp3', function() {
				beep.play();
				beep.sourceNode.playbackRate.value = 1.5 + (0.5 * count);
			});
		}
	}

	return new BackgroundMusic();
});

triviaApp.controller('serverController', function($scope, $location, $timeout, connection, game, playback, sound) {
	$scope.timer = game.timer();
	$scope.players = game.players();
	$scope.title = "";
	$scope.pointChanges = {};
	$scope.state = "loading";
	$scope.hasGuessed = {};

	$scope.$on("data-guess", function(event, conn, data) {
		$scope.$apply(function() {
			game.guess(conn.peer, data.answer);
			$scope.hasGuessed[conn.peer] = true;
			sound.beep(Object.keys($scope.hasGuessed).length);
		});
	});

	function showLoadingNextQuestion() {
		return new Promise(function(resolve, reject) {
			$scope.state = 'loading';
			resolve();
		});
	}

	function showPreQuestion(question) {
		return new Promise(function(resolve, reject) {
			$scope.$apply(function() {
				$scope.state = 'pre-question';
				$scope.title = question.text;
			});
			$timeout(function() {
				resolve(question);
			}, 3000);
		});
	}

	function showQuestion(question) {
		return new Promise(function(resolve, reject) {
			console.log(question);

			var player = playback.player(question.view);
			player.start().then(function() {
				$scope.state = 'question';

				connection.sendAll({
					question : question //TODO: only send answers
				});

				game.startTimer().then(function(pointsThisRound) {
					player.stop();
					return resolve(pointsThisRound);
				});
				sound.pause();
			});
		});
	}

	function showPostQuestion(pointsThisRound) {
		return new Promise(function(resolve, reject) {
			sound.play();
			var correct = game.correctAnswer();
			document.getElementById('content').innerHTML = '';
			connection.sendAll({
				correct : { answer : correct.key }
			});
			$scope.$apply(function() {
				$scope.title = "The correct answer was:";
				$scope.correct = correct;
				$scope.state = 'post-question';
				$scope.pointChanges = pointsThisRound;
				$scope.hasGuessed = {};
			});
			$timeout(function() {
				$scope.$apply(function() {
					$scope.pointChanges = {};
				})
				connection.sendAll({
					wait : {}
				});
				resolve();
			}, 3000);
		});
	}

	function gameLoop() {
		showLoadingNextQuestion().then(function() {
			if (game.hasMoreQuestions()) {
				game.nextQuestion().then(showPreQuestion).then(showQuestion).then(showPostQuestion).then(gameLoop);
				return;
			}
			$scope.$apply(function() {
				$location.path('/results');
			})
		});
	}

	gameLoop();
});
