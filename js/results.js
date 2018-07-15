function ResultsController($scope, $location, game, sound, avatars) {
	$scope.avatars = avatars;
	$scope.scores = Object.values(game.players()).sort((a, b) => b.score - a.score);

	$scope.attribution = game.session().history().map((question) => question.view.attribution);

	$scope.domain = function(link) {
		return new URL(link).hostname;
	}

	$scope.duration = ($scope.scores.length + $scope.attribution.length + 1) * 5;

	$scope.ordinal = function(index) {
		if (((index / 10) % 10) == 1) {
			return "th";
		}
		switch (index % 10) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	}

	$scope.restart = function() {
		sound.pause();
		$location.path("/");	
	}
}
