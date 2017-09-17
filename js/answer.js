function AnswerController($scope, $location, connection, avatars) {
	var correct = null;
	var guess = null;
	var answers = {};

	$scope.connected = connection.connected();
	$scope.waiting = true;
	$scope.message = $scope.connected ? 'Waiting for the game to start' : 'Not connected';
	$scope.answers = {};
	$scope.avatars = avatars;

	$scope.$on('data-answers', (event, pairCode, data) => {
		$scope.$apply(() => {
			$scope.answers = data;
			$scope.waiting = false;
			correct = null;
			guess = null;
		});
	});

	$scope.$on('data-correct', (event, pairCode, data) => {
		$scope.$apply(() => {
			correct = data;
		});
	});

	$scope.$on('data-wait', (event, pairCode, data) => {
		$scope.$apply(() => {
			$scope.answers = {};
			$scope.waiting = true;
			$scope.message = 'Waiting for next question';
		});
	});

	$scope.$on('data-stats', (event, pairCode, data) => {
			$scope.stats = data;
	});

	$scope.$on('connection-closed', () => {
		$scope.$apply(() => {
			$scope.answers = {};
			$scope.waiting = true;
			$scope.message = 'The host closed the connection';
			$scope.connected = false;
		});
	});

	$scope.reconnect = function() {
		connection.reconnect().then(() => {
			$scope.$apply(() => {
				$scope.connected = connection.connected();
				$scope.message = 'Waiting for next question';
			});
		}).catch((err) => {
			$scope.$apply(() => {
				$scope.message = "Error when reconnecting: " + err;
			});
		});
	}

	$scope.guess = function(answer) {
		guess = answer;
		connection.send({
			guess : answer
		});
	}

	$scope.buttonClass = function(answer) {
		if (correct && correct == answer) {
			return "correct";
		} else if (correct && answer == guess && correct != guess) {
			return "incorrect";
		} else if (!correct && answer == guess) {
			return "selected";
		} else {
			return "";
		}
	}

	$scope.hasGuessed = function() {
		return guess != null;
	}
}
