triviaApp.controller('lobbyController', function($rootScope, $scope, $location, connection, game, movies, sound) {
	var config = config = {
		questions : 10,
		time : 30,
		pointsPerRound : 1000,
		stopOnAnswers : true,
		allowMultiplier : true,
		backgroundMusic : true,
		categories : {}
	};

	$scope.preloading = {};
	$scope.config = config;
	$scope.peerid = connection.peerid;
	$scope.players = function() {
		return Object.values(game.players());
	};

	$scope.toggleMusic = function() {
		sound.toggle(config.backgroundMusic);
	}

	$scope.preload = function(type) {
		var preload = {
			current : 0,
			total : 0,
			done : false,
			progress : function(current, total) {
				preload.current = current;
				preload.total = total;
			},
			percentage : function() {
				return Math.ceil(preload.current / preload.total * 100);
			}
		};

		$scope.preloading[type] = preload;

		movies.preload(preload.progress).then(function() {
			$scope.$apply(function() {
				preload.done = true;
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

	connection.connect().then(connection.host).then(function() {
		$scope.$on('data-join', function(event, conn, data) {
			$scope.$apply(function() {
				game.addPlayer(conn.peer, data.name);
			});
			conn.send({
				wait : {}
			});
		});
		$scope.$digest();
	}).catch(function(err) {
		$scope.$apply(function() {
			$scope.message = "Error when creating PeerJS connection: " + err;
		});
	});
});
