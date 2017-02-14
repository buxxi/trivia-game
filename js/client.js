var triviaClient = angular.module('triviaClient', ['ngRoute']);

triviaClient.config(($routeProvider) => {
	$routeProvider.when('/', {
			templateUrl : 'pages/join.html',
			controller  : 'joinController'
		}).when('/game', {
			templateUrl : 'pages/game-client.html',
			controller  : 'answerController'
		});
});

triviaClient.service('connection', Connection);
triviaClient.controller('answerController', AnswerController);
triviaClient.controller('joinController', JoinController);
