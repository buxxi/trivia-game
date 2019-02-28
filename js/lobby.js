function LobbyController($rootScope, $scope, $location, $routeParams, connection, game, categories, sound, avatars, fingerprint, config) {
	var carouselTimeout = 0;

	$scope.availableCategories = [];
	//TODO: maybe move the preloading status into the categories-service instead? It's now in rootScope to avoid problems when playing second game
	if (!$rootScope.preloading) {
		$rootScope.preloading = {};
	}
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

	$scope.poweredBy = categories.attribution();

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
		if ($rootScope.preloading[type]) {
			return new Promise((resolve, reject) => resolve());
		}

		var preload = {
			current : 0,
			total : 0,
			done : false,
			failed : false,
			progress : function(current, total) {
				if(!$scope.$$phase) {
					$scope.$apply(() => {
						preload.current = current;
						preload.total = total;
					});
				}
			},
			percentage : function() {
				return Math.ceil(preload.current / Math.max(preload.total, 1) * 100);
			},
			showProgress : function() {
				return !preload.done || !preload.failed;
			}
		};

		$rootScope.preloading[type] = preload;

		return new Promise((resolve, reject) => {
			categories.preload(type, preload.progress, game).then(() => {
				$scope.$apply(() => preload.done = true);
				resolve();
			}).catch((err) => {
				$scope.$apply(() => {
					console.log(err);
					preload.failed = true;
					reject(err);
				});
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

		var allPreloaded = categories.map((cat) => $rootScope.preloading[cat].done).reduce((pre, cur) => pre && cur, true);

		if (!allPreloaded) {
			$scope.startTitle = "Not all selected categories has preloaded";
		} else {
			$scope.startTitle = "The game is ready to start";
		}

		return allPreloaded;
	}

	$scope.loadAll = async function() {
		for (let type of $scope.availableCategories.map(c => c.type)) {
			config.categories[type] = true;
			await $scope.preload(type);
		}
	}

	$scope.clearCache = function() {
		for (let type of $scope.availableCategories.map(c => c.type)) {
			config.categories[type] = false;
			delete $scope.preloading[type];
		}
		categories.clearCache();
	}

	$scope.start = function() {
		sound.play();
		game.configure();
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
		game.addPlayer(data.pairCode, data.name, data.avatar);

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
		carouselTimeout = setTimeout(moveCarousel, 5000);
	}

	if ($routeParams.fakePlayers) { //For debugging layout
		for (var i = 1; i <= $routeParams.fakePlayers; i++) {
			game.addPlayer(i, "Fake" + i);
		}
	}

	categories.init().then(() => {
		$scope.availableCategories = categories.available();
		$scope.poweredBy = categories.attribution();
		$scope.$digest();
		moveCarousel();
	});
}
