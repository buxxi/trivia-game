function AnswerController($scope, $location, connection) {
	var correct = null;
	var guess = null;
	var answers = {};

	if (!connection.code()) {
		$location.path('/');
	}

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
		});
	});

	$scope.$on('connection-closed', () => {
		$scope.$apply(() => {
			$location.path('/').search({disconnected : true});
		});
	});

	$scope.answers = {};

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
