export default {
	data: function() { return({
		connected: this.connection.connected(),
		waiting: true,
		hasGuessed: false,
		message: this.connection.connected() ? 'Waiting for the game to start' : 'Not connected',
		answers: {},
		correct: undefined,
		guess: undefined
	})},
	props: ['connection', 'gameId', 'clientId', 'stats'],
	created: function() {
		if (!this.connection.connected()) {
			return;
		}
		this.connection.onQuestionStart(async answers => {
			this.answers = answers;
			this.waiting = false;
			this.correct = null;
			this.guess = null;
			this.hasGuessed = false;
		});

		this.connection.onQuestionEnd(async (pointsThisRound, correct) => {
			this.correct = correct;
			//TODO: update stats
			setTimeout(() => {
				this.answers = {};
				this.waiting = true;
				this.message = 'Waiting for next question';
			}, 2000);
		});

		this.connection.onDisconnect(() => {
			this.answers = {};
			this.waiting = true;
			this.message = 'The host closed the connection';
			this.connected = false;
		});

		this.connection.onGameEnd(async () => {
			//TODO: redirect to join with same gameid, name and avatar
		});
	},
	methods: {
		reconnect: async function() {
			try {
				this.stats = await this.connection.reconnect(this.gameId, this.clientId);
				//TODO: set stats and setup listeners
				this.connected = true;
				this.message = 'Waiting for next question';
			} catch (e) {
				this.message = "Error when reconnecting: " + e;				
			}
		},
		makeGuess: async function(answer) {
			try {
				console.log("Trying to guess " + answer);
				this.hasGuessed = true;
				await this.connection.guess(answer);
				this.guess = answer;
			} catch (e) {
				this.hasGuessed = false;
				this.guess = null;					
			}
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
