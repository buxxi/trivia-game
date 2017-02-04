triviaApp.controller('lobbyController', function($rootScope, $scope, $location, connection, game, categories, sound) {
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

	$scope.availableCategories = categories.available();
	$scope.preloading = {};
	$scope.config = config;
	$scope.code = connection.code;

	$scope.serverUrl = function() {
		return window.location.hostname + "/trivia";
	}

	$scope.url = function() {
		return encodeURIComponent(window.location.href.replace('server.html', 'client.html') + "?code=" + $scope.code());
	}

	$scope.players = game.players;
	$scope.playerCount = function() { return Object.keys(game.players()).length; };

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

	$scope.kickPlayer = function(pairCode) {
		game.removePlayer(pairCode);
		connection.close(pairCode);
	}

	$scope.usingFallbackConnection = function(pairCode) {
		return connection.usingFallback(pairCode);
	}

	$scope.toggleFullScreen = function() {
		var fullScreenMode = function() { return document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen };
		var notify = function() {
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

		categories.preload(type, preload.progress).then(function() {
			$scope.$apply(function() {
				preload.done = true;
			});
		}).catch(function(err) {
			$scope.$apply(function() {
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

		var categories = Object.keys(config.categories).filter(function(cat) { return config.categories[cat] });
		if (categories.length == 0) {
			$scope.startTitle = "Not enough categories selected";
			return false;
		}

		var allPreloaded = categories.map(function(cat) {
			return $scope.preloading[cat].done;
		}).reduce(function(pre, cur) {
			return pre && cur;
		}, true);

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
		$location.path('/game');
	}

	$scope.addCategories = function(files) {
		for (var i in files) {
			categories.load(files[i]).then(function(type) {
				$scope.$apply(function() {
					$scope.availableCategories = categories.available();
					$scope.preload(type);
					config.categories[type] = true;
				});
			});
		}
	}

	connection.host(function(data) {
		game.addPlayer(data.pairCode, data.name);

		$scope.$apply(function() {});
	}).then(function() {
		$scope.$on("connection-upgraded", function(event, conn) {
			$scope.$digest();
		});
		$scope.$digest();
	}).catch(function(err) {
		$scope.$apply(function() {
			$scope.message = "Error when creating connection: " + err;
		});
	});

	function moveCarousel() {
		var carousel = document.querySelector(".carousel");
		var next = carousel.querySelector(".show + li") || carousel.querySelector("li");
		carousel.querySelectorAll("li").forEach(function(li) {
			li.classList.remove('show');
		});
		next.classList.add('show');
		setTimeout(moveCarousel, 5000);
	}

	angular.element(document).ready(moveCarousel);
});
