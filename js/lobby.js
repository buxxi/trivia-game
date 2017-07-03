function LobbyController($rootScope, $scope, $location, $routeParams, connection, game, categories, sound, avatars, fingerprint) {
	var config = {
		questions : 10,
		time : 30,
		pointsPerRound : 1000,
		stopOnAnswers : true,
		allowMultiplier : true,
		sound : sound.enabled(),
		categories : {},
		fullscreen : false
	};

	var carouselTimeout = 0;

	$scope.availableCategories = [];
	$scope.preloading = {};
	$scope.config = config;

	$scope.serverUrl = function() {
		return window.location.hostname + "/trivia";
	}

	$scope.url = function() {
		return encodeURIComponent(window.location.href.replace('server.html', 'client.html') + "?code=" + $scope.code);
	}

	$scope.avatars = avatars;
	$scope.players = game.players;
	$scope.playerCount = function() {
		return Object.keys(game.players()).length;
	};

	$scope.poweredBy = [
		{ url: 'https://spotify.com', name: 'Spotify' },
		{ url: 'https://youtube.com', name: 'YouTube' },
		{ url: 'https://www.themoviedb.org', name: 'TheMovieDB' },
		{ url: 'https://restcountries.eu', name: 'REST Countries' },
		{ url: 'https://flagpedia.net', name: 'Flagpedia' },
		{ url: 'https://developers.google.com/chart', name: 'Google Charts' },
		{ url: 'https://market.mashape.com/andruxnet/random-famous-quotes', name: 'Mashape - Famous Random Quotes' },
		{ url: 'https://www.igdb.com', name: 'IGDB' },
		{ url: 'https://www.thecocktaildb.com', name: 'TheCocktailDB' }
	]

	$scope.countQuestions = function() {
		return categories.countQuestions(config.categories);
	}

	$scope.kickPlayer = function(pairCode) {
		game.removePlayer(pairCode);
		connection.close(pairCode);
	}

	$scope.usingFallbackConnection = function(pairCode) {
		return connection.usingFallback(pairCode);
	}

	$scope.hasConnectionError = function(pairCode) {
		return connection.connectionError(pairCode);
	}

	$scope.toggleFullScreen = function() {
		var fullScreenMode = () => document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
		var notify = () => {
			config.fullscreen = fullScreenMode();
			document.removeEventListener("fullscreenchange", notify);
   			document.removeEventListener("webkitfullscreenchange", notify);
   			document.removeEventListener("mozfullscreenchange", notify);
		}
		document.addEventListener("fullscreenchange", notify);
   		document.addEventListener("webkitfullscreenchange", notify);
   		document.addEventListener("mozfullscreenchange", notify);
		if (fullScreenMode()) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
		} else {
			var e = document.documentElement;
			if (e.requestFullscreen) {
				e.requestFullscreen();
			} else if (e.mozRequestFullScreen) {
				e.mozRequestFullScreen();
			} else if (e.webkitRequestFullScreen) {
				e.webkitRequestFullScreen();
			}
		}
	}

	$scope.preload = function(type) {
		if ($scope.preloading[type]) {
			return;
		}

		var preload = {
			current : 0,
			total : 0,
			done : false,
			failed : false,
			progress : function(current, total) {
				preload.current = current;
				preload.total = total;
			},
			percentage : function() {
				return Math.ceil(preload.current / Math.max(preload.total, 1) * 100);
			},
			showProgress : function() {
				return !preload.done || !preload.failed;
			}
		};

		$scope.preloading[type] = preload;

		categories.preload(type, preload.progress).then(() => {
			$scope.$apply(() => preload.done = true);
		}).catch((err) => {
			$scope.$apply(() => {
				console.log(err);
				preload.failed = true;
			});
		});
	}

	$scope.readyToStart = function() {
		if (Object.keys(game.players()).length == 0) {
			$scope.startTitle = "Not enough players";
			return false;
		}

		var categories = Object.keys(config.categories).filter((cat) => config.categories[cat]);
		if (categories.length == 0) {
			$scope.startTitle = "Not enough categories selected";
			return false;
		}

		var allPreloaded = categories.map((cat) => $scope.preloading[cat].done).reduce((pre, cur) => pre && cur, true);

		if (!allPreloaded) {
			$scope.startTitle = "Not all selected categories has preloaded";
		} else {
			$scope.startTitle = "The game is ready to start";
		}

		return allPreloaded;
	}

	$scope.start = function() {
		sound.play();
		game.configure(config);
		connection.disconnect();
		clearTimeout(carouselTimeout);
		$location.path('/game');
	}

	$scope.addCategories = function(files) {
		for (var i = 0; i < files.length; i++) {
			categories.loadFromFile(files[i]).then((type) => {
				$scope.$apply(() => {
					$scope.availableCategories = categories.available();
					$scope.preload(type);
					config.categories[type] = true;
				});
			});
		}
	}

	if ($routeParams.forcePairCode) { //For debugging easier and making it easier for people without QR reader
		fingerprint.get = function(callback) {
			callback($routeParams.forcePairCode);
		}
	}

	connection.host((data) => {
		game.addPlayer(data.pairCode, data.name);

		$scope.$digest();
	}).then((code) => {
		$scope.code = code;
		$scope.$on("connection-upgraded", (event, conn) => $scope.$digest());
		$scope.$on("connection-closed", (event, conn) => $scope.$digest());
		$scope.$digest();
	}).catch((err) => {
		$scope.$apply(() => $scope.message = "Error when creating connection: " + err);
	});

	function moveCarousel() {
		var carousel = document.querySelector(".carousel");
		var next = carousel.querySelector(".show + li") || carousel.querySelector("li");
		carousel.querySelectorAll("li").forEach((li) => li.classList.remove('show'));
		next.classList.add('show');
		carousel = setTimeout(moveCarousel, 5000);
	}

	if ($routeParams.fakePlayers) { //For debugging layout
		for (var i = 1; i <= $routeParams.fakePlayers; i++) {
			game.addPlayer(i, "Fake" + i);
		}
	}

	categories.init().then(() => {
		$scope.availableCategories = categories.available();
		$scope.$digest();
		moveCarousel();
	});
}
