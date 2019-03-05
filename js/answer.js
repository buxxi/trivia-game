function AnswerController(connection, avatars) {
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

	connection.on('data-answers', (pairCode, data) => {
		app.answers = data;
		app.waiting = false;
		app.correct = null;
		app.guess = null;
		app.hasGuessed = false;
	});

	connection.on('data-correct', (pairCode, data) => {
		app.correct = data;
	});

	connection.on('data-wait', (pairCode, data) => {
		app.answers = {};
		app.waiting = true;
		app.message = 'Waiting for next question';
	});

	connection.on('data-stats', (pairCode, data) => {
		app.stats = data;
	});

	connection.on('connection-closed', (pairCode, data) => {
		app.answers = {};
		app.waiting = true;
		app.message = 'The host closed the connection';
		app.connected = false;
	});
}
