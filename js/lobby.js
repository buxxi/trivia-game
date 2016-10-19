triviaApp.controller('lobbyController', function($rootScope, $scope, $location, connection, game, categories, sound) {
	var config = {
		questions : 10,
		time : 30,
		pointsPerRound : 1000,
		stopOnAnswers : true,
		allowMultiplier : true,
		sound : sound.enabled(),
		categories : {}
	};

	$scope.availableCategories = categories.available();
	$scope.preloading = {};
	$scope.config = config;
	$scope.code = connection.code;

	$scope.url = function() {
		return encodeURIComponent(window.location.href.replace('server.html', 'client.html') + "?code=" + $scope.code());
	}

	$scope.players = game.players;

	$scope.kickPlayer = function(pairCode) {
		game.removePlayer(pairCode);
		connection.close(pairCode);
	}

	$scope.usingFallbackConnection = function(pairCode) {
		return connection.usingFallback(pairCode);
	}

	$scope.toggleSound = function() {
		sound.configure(config.sound);
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
				return Math.ceil(preload.current / preload.total * 100);
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
			console.log("Not enough players");
			return false;
		}

		var categories = Object.keys(config.categories).filter(function(cat) { return config.categories[cat] });
		if (categories.length == 0) {
			console.log("Not enough categories selected");
			return false;
		}

		var allPreloaded = categories.map(function(cat) {
			return $scope.preloading[cat].done;
		}).reduce(function(pre, cur) {
			return pre && cur;
		}, true);

		if (!allPreloaded) {
			console.log("Not all selected categories has preloaded");
		}

		return allPreloaded;
	}

	$scope.start = function() {
		game.configure(config);
		connection.disconnect();
		$location.path('/game');
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
});
