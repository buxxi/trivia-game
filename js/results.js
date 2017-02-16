function ResultsController($scope, $location, game, avatars) {
	$scope.avatars = avatars;
	$scope.scores = Object.values(game.players()).sort((a, b) => b.score - a.score);

	$scope.attribution = game.session().history().map((question) => question.view.attribution);

	$scope.domain = function(link) {
		return new URL(link).hostname;
	}

	$scope.duration = ($scope.scores.length + $scope.attribution.length + 1) * 5;
}
