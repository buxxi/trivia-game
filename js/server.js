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
triviaApp.run(function($rootScope, avatars) {
	Object.keys(avatars).forEach(function(avatar) {
		avatars[avatar] = {
			code : avatars[avatar],
			url : /src=\"(.*?)\"/.exec(twemoji.parse(avatars[avatar]))[1]
		}
	});
	$rootScope.avatars = avatars;
});
triviaApp.constant('apikeys', {});
triviaApp.run(function($http, apikeys) {
	$http.get('js/api-keys.json').then(function(response) {
		Object.keys(response.data).forEach(function(key) {
			apikeys[key] = response.data[key];
		});
	});
});

triviaApp.controller('serverController', function($scope, $location, $timeout, connection, game, playback, sound, avatars) {
	$scope.timer = game.timer();
	$scope.players = game.players();
	$scope.title = "";
	$scope.pointChanges = {};
	$scope.state = "loading";
	$scope.hasGuessed = {};
	$scope.avatars = avatars;

	$scope.$on("data-guess", function(event, pairCode, data) {
		$scope.$apply(function() {
			game.guess(pairCode, data);
			$scope.hasGuessed[pairCode] = true;
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

			var spoked = false;
			var timelimit = false;

			sound.speak(question.text, function() {
				spoken = true;
				if (timelimit) {
					resolve(question);
				}
			});
			$timeout(function() {
				timelimit = true;
				if (spoken) {
					resolve(question);
				}
			}, 3000);
		});
	}

	function showQuestion(question) {
		return new Promise(function(resolve, reject) {
			console.log(question);

			var player = playback.player(question.view);
			player.start().then(function() {
				$scope.$apply(function() {
					$scope.state = 'question';
				});

				connection.send({
					answers : question.answers
				});

				game.startTimer().then(function(pointsThisRound) {
					player.stop();
					return resolve(pointsThisRound);
				});
				if (player.pauseMusic) {
					sound.pause();
				}
			});
		});
	}

	function showPostQuestion(pointsThisRound) {
		return new Promise(function(resolve, reject) {
			sound.play();
			var correct = game.correctAnswer();
			document.getElementById('content').innerHTML = '';
			connection.send({
				correct : correct.key
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
				connection.send({
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
