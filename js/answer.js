triviaApp.controller('answerController', function($scope, $location, connection) {
	var correct = null;
	var guess = null;
	var answers = {};

	if (!connection.peerid()) {
		$location.path('/');
	}

	$scope.$on('data-question', function(event, conn, data) {
		$scope.$apply(function() {
			$scope.answers = data.answers;
			correct = null;
			guess = null;
		});
	});

	$scope.$on('data-correct', function(event, conn, data) {
		$scope.$apply(function() {
			correct = data.answer;
		});
	});

	$scope.$on('data-wait', function(event, conn, data) {
		$scope.$apply(function() {
			$scope.answers = {};
		});
	});

	$scope.$on('host-disconnected', function() {
		$scope.$apply(function() {
			$location.path('/').search({disconnected : true});
		});
	});

	$scope.answers = {};

	$scope.guess = function(answer) {
		guess = answer;
		connection.sendHost({
			guess : {
				answer : answer
			}
		});
	}

	$scope.buttonClass = function(answer) {
		if (correct && correct == answer) {
			return "btn-success";
		} else if (correct && answer == guess && correct != guess) {
			return "btn-danger";
		} else if (!correct && answer == guess) {
			return "btn-primary";
		} else {
			return "btn-default";
		}
	}

	$scope.hasGuessed = function() {
		return guess != null;
	}
});
