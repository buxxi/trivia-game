triviaApp.controller('resultController', function($scope, $location, game) {
	$scope.scores = Object.values(game.players()).sort(function(a, b) {
		return b.score - a.score;
	});

	$scope.attribution = game.session().history().map(function(question) {
		return question.view.attribution;
	});

	$scope.domain = function(link) {
		return new URL(link).hostname;
	}
});
