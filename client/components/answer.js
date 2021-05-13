import avatars from '../js/avatars.js';

export default {
	data: function() { return({
		connected: this.connection.connected(),
		waiting: true,
		hasGuessed: false,
		message: this.connection.connected() ? 'Waiting for the game to start' : 'Not connected',
		answers: {},
		avatars: avatars,
		stats: {},
		correct: undefined,
		guess: undefined
	})},
	props: ['connection'],
	created: function() {
		this.connection.on('data-answers', (pairCode, data) => {
			this.answers = data;
			this.waiting = false;
			this.correct = null;
			this.guess = null;
			this.hasGuessed = false;
		});
	
		this.connection.on('data-correct', (pairCode, data) => {
			this.correct = data;
		});
	
		this.connection.on('data-wait', (pairCode, data) => {
			this.answers = {};
			this.waiting = true;
			this.message = 'Waiting for next question';
		});
	
		this.connection.on('data-stats', (pairCode, data) => {
			this.stats = data;
		});
	
		this.connection.on('connection-closed', (pairCode, data) => {
			this.answers = {};
			this.waiting = true;
			this.message = 'The host closed the connection';
			this.connected = false;
		});
	},
	methods: {
		reconnect: function() {
			this.connection.reconnect().then(() => {
				this.connected = this.connection.connected();
				this.message = 'Waiting for next question';
			}).catch((err) => {
				this.message = "Error when reconnecting: " + err;
			});
		},
		makeGuess: function(answer) {
			this.hasGuessed = true;
			this.connection.send({
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
};
