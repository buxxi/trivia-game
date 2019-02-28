function AnswerController($scope, connection, avatars) {
	let app = new Vue({
		el: '.answer',
		data: {
			connected: connection.connected(),
			waiting: true,
			hasGuessed: false,
			message: connection.connected() ? 'Waiting for the game to start' : 'Not connected',
			answers: {},
			avatars: avatars,
			stats: {},
			correct: undefined,
			guess: undefined
		},
		methods: {
			reconnect: function() {
				connection.reconnect().then(() => {
					this.connected = connection.connected();
					this.message = 'Waiting for next question';
				}).catch((err) => {
					this.message = "Error when reconnecting: " + err;
				});
			},
			makeGuess: function(answer) {
				this.hasGuessed = true;
				connection.send({
					guess : answer
				}).then(() => {
					this.guess = answer;
				}).catch((e) => {
					this.hasGuessed = false;
					this.guess = null;			
				});
			},
			buttonClass: function(answer) {
				if (this.correct && this.correct == answer) {
					return "correct";
				} else if (this.correct && answer == this.guess && this.correct != this.guess) {
					return "incorrect";
				} else if (!this.correct && answer == this.guess) {
					return "selected";
				} else {
					return "";
				}
			}
		}
	});

	$scope.$on('data-answers', (event, pairCode, data) => {
		app.answers = data;
		app.waiting = false;
		app.correct = null;
		app.guess = null;
		app.hasGuessed = false;
	});

	$scope.$on('data-correct', (event, pairCode, data) => {
		app.correct = data;
	});

	$scope.$on('data-wait', (event, pairCode, data) => {
		app.answers = {};
		app.waiting = true;
		app.message = 'Waiting for next question';
	});

	$scope.$on('data-stats', (event, pairCode, data) => {
		app.stats = data;
	});

	$scope.$on('connection-closed', () => {
		app.answers = {};
		app.waiting = true;
		app.message = 'The host closed the connection';
		app.connected = false;
	});
}
