function showAnswers(app, answers) {
	app.answers = answers;
	app.waiting = false;
	app.correct = null;
	app.guess = null;
	app.hasGuessed = false;	
}

function showCorrect(app, pointsThisRound, correct) {
	app.correct = correct.key;
	app.stats.score += pointsThisRound.points;
	app.stats.multiplier += pointsThisRound.multiplier;

	setTimeout(() => {
		app.answers = {};
		app.waiting = true;
		app.message = 'Waiting for next question';
	}, 2000);
}

function showClosed(app) {
	app.answers = {};
	app.waiting = true;
	app.message = 'The host closed the connection';
	app.connected = false;
}

function redirectToJoin(app) {
	app.connection.close();
	app.$router.push({ name: "join", query : { gameId: app.gameId }, params: { preferredAvatar: app.stats.avatar, name: app.stats.name } });
}

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

		this.connection.onQuestionStart().then(async answers => showAnswers(this, answers));
		this.connection.onQuestionEnd().then(async (data) => showCorrect(this, data.pointsThisRound, data.correct));
		this.connection.onClose().catch(() => showClosed(this));
		this.connection.onGameEnd().then(async () => { redirectToJoin(this)});
	},
	methods: {
		reconnect: async function() {
			try {
				let data = await this.connection.reconnect(this.gameId, this.clientId);
				for (let key in data.stats) {
					this.$set(this.stats, key, data.stats[key]);
				}
				this.connected = true;
				this.message = 'Waiting for the game to start';
			} catch (e) {
				this.message = "Error when reconnecting: " + e;				
			}
		},

		returnToLobby: function() {
			this.$router.push({ name: "join" });
		},

		makeGuess: async function(answer) {
			try {
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
			} else if (this.correct && this.correct != answer) {
				return "unused"
			} else if (!this.correct && answer == this.guess) {
				return "selected";
			} else {
				return "";
			}
		}
	}
};
