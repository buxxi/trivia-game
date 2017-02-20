function AnswerController($scope, $location, connection) {
	var correct = null;
	var guess = null;
	var answers = {};

	$scope.connected = connection.connected();
	$scope.message = $scope.connected ? 'Waiting for the game to start' : 'Not connected';

	$scope.$on('data-answers', (event, pairCode, data) => {
		$scope.$apply(() => {
			$scope.answers = data;
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
			$scope.message = 'Waiting for next question';
		});
	});

	$scope.$on('connection-closed', () => {
		$scope.$apply(() => {
			$scope.answers = {};
			$scope.message = 'The host closed the connection';
			$scope.connected = false;
		});
	});

	$scope.answers = {};

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
