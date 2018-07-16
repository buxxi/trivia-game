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

triviaApp.constant('avatars', function(avatars) {
		Object.values(avatars).forEach((avatar) => {
			avatar.url = /src=\"(.*?)\"/.exec(twemoji.parse(avatar.code))[1];
		});
		return avatars;
	}({
	monkey : { code :'\uD83D\uDC35' },
	dog : { code :'\uD83D\uDC36' },
	wolf : { code :'\uD83D\uDC3A' },
	cat : { code :'\uD83D\uDC31' },
	lion : { code :'\uD83E\uDD81' },
	tiger : { code :'\uD83D\uDC2F' },
	horse : { code :'\uD83D\uDC34' },
	cow : { code :'\uD83D\uDC2E' },
	dragon : { code :'\uD83D\uDC32' },
	pig : { code :'\uD83D\uDC37' },
	mouse : { code :'\uD83D\uDC2D' },
	hamster : { code :'\uD83D\uDC39' },
	rabbit : { code :'\uD83D\uDC30' },
	bear : { code :'\uD83D\uDC3B' },
	panda : { code :'\uD83D\uDC3C' },
	frog : { code :'\uD83D\uDC38' },
	octopus : { code :'\uD83D\uDC19' },
	turtle : { code :'\uD83D\uDC22' },
	bee : { code :'\uD83D\uDC1D' },
	snail : { code :'\uD83D\uDC0C' },
	penguin : { code :'\uD83D\uDC27' },
	dromedary : { code :'\uD83D\uDC2A' }
}));
triviaApp.constant('fingerprint', new Fingerprint2());

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
triviaApp.service('actors', ActorQuestions);
triviaApp.service('meta', CurrentGameQuestions);
triviaApp.service('categories', Categories);
triviaApp.service('playback', Playback);
triviaApp.service('game', Game);
triviaApp.controller('questionController', QuestionController);
triviaApp.controller('lobbyController', LobbyController);
triviaApp.controller('resultController', ResultsController);
