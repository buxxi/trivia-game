<template>
	<div class="answer">
		<div class="stats" :style="{'background-color': stats.color}">
			<Avatar :avatar="stats.avatar"/>
			<div><i class="fas fa-fw fa-star"></i>{{ stats.score }}</div>
			<div><i class="fas fa-fw fa-times"></i>{{ stats.multiplier }}</div>
		</div>
		<div v-if="waiting">
			<div class="fa-stack fa-5x">
				<i class="fas fa-tv fa-stack-2x"></i>
				<i class="fas fa-stack-1x" :class="{'fa-eye' : connected, 'fa-bolt' : !connected}"></i>
			</div>
			<h3>{{ message }}</h3>
			<div class="buttons" v-if="!connected">
				<button v-on:click.prevent="reconnect"><i class="fas fa-fw fa-sync"></i> Reconnect</button>
				<button v-on:click.prevent="returnToLobby"><i class="fas fa-fw fa-sign-out-alt"></i> To lobby</button>
			</div>
		</div>

		<GuessButton answer="A" :correct="correct" :guess="guess" v-if="!waiting && answers.A" v-on:click.prevent="makeGuess('A')">{{ answers.A }}</GuessButton>
		<GuessButton answer="B" :correct="correct" :guess="guess" v-if="!waiting && answers.B" v-on:click.prevent="makeGuess('B')">{{ answers.B }}</GuessButton>
		<GuessButton answer="C" :correct="correct" :guess="guess" v-if="!waiting && answers.C" v-on:click.prevent="makeGuess('C')">{{ answers.C }}</GuessButton>
		<GuessButton answer="D" :correct="correct" :guess="guess" v-if="!waiting && answers.D" v-on:click.prevent="makeGuess('D')">{{ answers.D }}</GuessButton>
	</div>
</template>

<script>
import AnswerIcon from "../../common/components/AnswerIcon.vue";
import GuessButton from "./GuessButton.vue";
import Avatar from "../../common/components/Avatar.vue";

function showAnswers(app, answers) {
	app.answers = answers;
	app.waiting = false;
	app.correct = null;
	app.guess = null;
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

async function redirectToJoin(app) {
	await app.wakelock.release();
	let gameId = app.clientState.getInProgressGameId();
	app.clientState.clearInProgressGameId();
	app.clientState.clearInProgressClientId();
	app.$router.push({name: "join", query: {gameId: gameId, preferredAvatar: app.stats.avatar, name: app.stats.name}});
}

export default {
	components: {Avatar, GuessButton, AnswerIcon},
	data: function () {
		return {
			connected: this.connection.connected(),
			waiting: true,
			message: this.connection.connected() ? 'Waiting for the game to start' : 'Not connected',
			answers: {},
			correct: undefined,
			guess: undefined
		}
	},
	props: ['connection', 'wakelock', 'clientState', 'stats'],
	created: function () {
		if (!this.connection.connected()) {
			return;
		}
		this._registerListeners();
	},
	methods: {
		reconnect: async function () {
			try {
				let data = await this.connection.reconnect(this.clientState.getInProgressGameId(), this.clientState.getInProgressClientId());
				for (let key in data.stats) {
					this.stats[key] = data.stats[key];
				}
				this._registerListeners();
				this.connected = true;
				this.message = 'Waiting for the game to continue';
			} catch (e) {
				this.message = "Error when reconnecting: " + e;
			}
		},

		returnToLobby: function () {
			this.clientState.clearInProgressGameId();
			this.clientState.clearInProgressClientId();
			this.$router.push({name: "join"});
		},

		makeGuess: async function (answer) {
			try {
				await this.connection.guess(answer);
				this.guess = answer;
			} catch (e) {
				this.guess = null;
			}
		},

		_registerListeners: function () {
			this.connection.onQuestionStart().then(async answers => showAnswers(this, answers));
			this.connection.onQuestionEnd().then(async (data) => showCorrect(this, data.pointsThisRound, data.correct));
			this.connection.onClose().catch(() => showClosed(this));
			this.connection.onGameEnd().then(async () => redirectToJoin(this));
		}
	}
};

</script>

<style lang="scss">
@use "../../common/css/colors" as triviacolors;
.answer {
	height : 100%;
	left : 0;
	margin : 0;
	padding : 0;
	position: absolute;
	text-align: center;
	top : 0;
	width : 100%;
	display : flex;
	flex-direction: column;

	.stats {
		height: 20%;
		font-weight: bold;
		font-size: 3em;
		display: flex;
		justify-content: space-around;
		align-items: center;
		border-bottom : 0.1em solid triviacolors.$primary;
		text-shadow : 0.05em 0.05em 0 triviacolors.$primary;
		.avatar {
			font-size: 0.5em !important;
		}
	}

	button {
		font-size: 1.5em !important;
		text-align: left;
		flex: 1;
	}

	.fa-stack {
		margin-top : 1em;
	}
	.fa-stack-2x {
		color: triviacolors.$primary;
	}
	.fa-stack-1x {
		animation: splash 0.5s linear normal;
		line-height: 1.75em;
	}
	h3 {
		font-size: 2em;
	}
}
</style>