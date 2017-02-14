var triviaApp = angular.module('triviaServer', ['ngRoute']);

triviaApp.config(($routeProvider) => {
	$routeProvider.when('/', {
			templateUrl : 'pages/lobby.html',
			controller  : 'lobbyController'
		}).when('/game', {
			templateUrl : 'pages/game-server.html',
			controller  : 'questionController'
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
	$http.get('conf/api-keys.json').then((response) => {
		Object.keys(response.data).forEach((key) => {
			apikeys[key] = response.data[key];
		});
	});
});

triviaApp.service('sound', SoundController);
triviaApp.service('connection', Connection);
triviaApp.service('youtube', YoutubeLoader);
triviaApp.service('genericloader', GenericCategoryLoader);
triviaApp.service('drinks', DrinksQuestions);
triviaApp.service('geography', GeographyQuestions);
triviaApp.service('movies', MovieQuestions);
triviaApp.service('music', MusicQuestions);
triviaApp.service('quotes', QuotesQuestions);
triviaApp.service('videogames', VideoGameQuestions);
triviaApp.service('categories', Categories);
triviaApp.service('playback', Playback);
triviaApp.service('game', Game);
triviaApp.controller('questionController', QuestionController);
triviaApp.controller('lobbyController', LobbyController);
triviaApp.controller('resultController', ResultsController);
