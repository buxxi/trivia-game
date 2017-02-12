var triviaApp = angular.module('triviaClient', ['ngRoute']);

triviaApp.config(($routeProvider) => {
	$routeProvider.when('/', {
			templateUrl : 'pages/join.html',
			controller  : 'joinController'
		}).when('/game', {
			templateUrl : 'pages/game-client.html',
			controller  : 'answerController'
		});
});
