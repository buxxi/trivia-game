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

triviaClient.constant('avatars', function(avatars) {
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
	penguin : { code :'\uD83D\uDC27' }/*,
	dromedary : { code :'\uD83D\uDC2A' }*/
}));
triviaClient.constant('fingerprint', new Fingerprint2());

triviaClient.service('connection', Connection);
triviaClient.controller('answerController', AnswerController);
triviaClient.controller('joinController', JoinController);
