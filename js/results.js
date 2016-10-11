triviaApp.controller('resultController', function($scope, $location, game) {
	$scope.scores = Object.values(game.players()).sort(function(a, b) {
		return b.score - a.score;
	});

	$scope.attribution = game.previousQuestions().map(function(question) {
		return {
			title : question.correct,
			links : question.view.attribution
		}
	});

	$scope.domain = function(link) {
		return new URL(link).hostname;
	}
});
