function ResultsController($scope, $location, game, sound, avatars) {
	let scores = Object.values(game.players()).sort((a, b) => b.score - a.score);
	let attribution = game.session().history().map((question) => question.view.attribution);
	let duration = (scores.length + attribution.length + 1) * 5

	let app = new Vue({
		el: '.credits',
		data: {
			avatars: avatars,
			scores: scores,
			attribution: attribution,
			duration: duration
		},
		methods: {
			ordinal : function(index) {
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
			},
			domain : function(link) {
				return new URL(link).hostname;
			}
		}
	})

	//Leaving this for now, until navigation is done in vue too
	$scope.restart = function() {
		sound.pause();
		$location.path("/");	
	}
}
