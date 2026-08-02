<template>
	<div class="question">
		<div class="top">
			<GameProgress ref="session" :hidden="state === 'loading'"/>
			<div class="title" :class="{'full-animation' : state === 'pre-question', 'full-static' : (state === 'question' && !minimizeQuestion)}">
				<span v-if="state === 'post-question'">{{ $t('states.postQuestion') }}</span>
				<span v-else-if="state === 'error'">{{ $t('states.error') }}</span>
				<span v-else>{{ title }}</span>
			</div>
			<Timer ref="timer"/>
		</div>
		<div id="content" :class="state">
			<component :is="playbackPlayer" ref="playback"/>
			<ErrorMessage v-if="state === 'error'">{{ error }}</ErrorMessage>
		</div>
		<AnswerIcon tag="div" id="correct" v-if="state === 'post-question'" :answer="correct['key']">{{ correct['answer'] }}</AnswerIcon>
		<RoundBanner ref="round"/>
		<div id="category-spinner" v-if="state === 'loading'">
			<CategorySpinner ref="spinner" @flip="sound.spinnerClick()"/>
		</div>
		<div class="bottom">
			<Players ref="players" :lobbyPlayers="lobbyPlayers" :hidden="hidePlayers" @allGuessedCorrect="allGuessedCorrect" @maxMultiplierLost="maxMultiplierLost"/>
		</div>
	</div>
</template>

<script>
import CategorySpinner from "./CategorySpinner.vue";
import AnswersPlayer from "./playback/AnswersPlayer.vue";
import AudioPlayer from "./playback/AudioPlayer.vue";
import BlankPlayer from "./playback/BlankPlayer.vue";
import ImagePlayer from "./playback/ImagePlayer.vue";
import ListPlayer from "./playback/ListPlayer.vue";
import QuotePlayer from "./playback/QuotePlayer.vue";
import VideoPlayer from "./playback/VideoPlayer.vue";
import Players from "./Players.vue";
import GameProgress from "./GameProgress.vue";
import Timer from "./Timer.vue";
import ErrorMessage from "../../../common/components/ErrorMessage.vue";
import RoundBanner from "./RoundBanner.vue";
import AnswerIcon from "../../../common/components/AnswerIcon.vue";

function resolveRef(app, ref) {
	return new Promise((resolve, _) => {
		let i = setInterval(() => {
			if (app.$refs[ref]) {
				clearInterval(i);
				resolve(app.$refs[ref]);
			}
		}, 1);
	});
}

async function showCategorySpinner(app, categories, correct, index, total, ttsId) {
	app.state = 'loading';
	app.title = '';

	let round = await resolveRef(app, 'round');
	round.show(index);

	let session = await resolveRef(app, 'session');
	session.update(index, total, correct);

	if (categories.length > 0) {
		let spinner = await resolveRef(app, 'spinner');
		await spinner.start(categories, correct);
	}

	return app.sound.speak(app.gameId, ttsId, 1500, 250);
}

async function displayQuestion(app, text, view, ttsId) {
	app.state = 'pre-question';
	app.title = text;
	app.hidePlayers = view.hidePlayers;
	await app.sound.speak(app.gameId, ttsId, 3000, 0);
}

function displayError(app, message) {
	return new Promise((resolve, _) => {
		app.playbackPlayer = undefined;
		app.hidePlayers = false;
		app.error = message;
		app.state = 'error';
		resolve();
	});
}

async function playbackStart(app, view, answers) {
	if (!view.player) {
		app.playbackPlayer = 'blank-player';
	} else {
		app.playbackPlayer = view.player + "-player";
	}

	let playback = await resolveRef(app, 'playback');

	await playback.start(view, answers);

	app.state = 'question';
	app.minimizeQuestion = playback.minimizeQuestion;

	if (playback.pauseMusic) {
		app.sound.pauseBackgroundMusic();
	}
}

async function playbackEnd(app, pointsThisRound, correct) {
	let playback = await resolveRef(app, 'playback');
	let timer = await resolveRef(app, 'timer');
	let players = await resolveRef(app, 'players');

	app.playbackPlayer = undefined;
	app.hidePlayers = false;
	playback.stop();

	timer.stop();
	app.sound.resumeBackgroundMusic();

	app.correct = correct;
	app.state = 'post-question';

	await players.showGuesses(pointsThisRound);
	await new Promise(resolve => setTimeout(resolve, 1000));
}

async function timerTicked(app, timeLeft, percentageLeft, currentScore) {
	let timer = await resolveRef(app, 'timer');
	let warning = timer.update(timeLeft, percentageLeft, currentScore);
	if (warning) {
		app.sound.timerWarning();
	}
}

async function playerGuessed(app, id) {
	let players = await resolveRef(app, 'players');
	let guessedPlayerCount = players.playerGuessed(id);
	app.sound.playerGuessed(guessedPlayerCount);
}

async function playerConnected(app, newPlayers) {
	let players = await resolveRef(app, 'players');
	players.playersConnected(newPlayers);
}

async function gameEnded(app, history, results) {
	app.connection.clearListeners();
	app.$router.push({
		name: 'results',
		query: {gameId: app.gameId},
		state: {results: JSON.stringify(results), history: JSON.stringify(history)}
	});
}

export default {
	data: function () {
		return {
			hidePlayers: false,
			playbackPlayer: undefined,
			title: '',
			state: 'loading',
			error: undefined,
			minimizeQuestion: false,
			correct: undefined
		}
	},
	props: ['gameId', 'connection', 'sound', 'lobbyPlayers'],
	components: {
		AnswerIcon,
		RoundBanner,
		ErrorMessage,
		Timer,
		GameProgress,
		Players,
		CategorySpinner,
		AnswersPlayer,
		AudioPlayer,
		BlankPlayer,
		ImagePlayer,
		ListPlayer,
		QuotePlayer,
		VideoPlayer
	},
	methods: {
		allGuessedCorrect() {
			this.sound.allGuessedCorrect();
		},

		maxMultiplierLost(multiplier) {
			//Someone lost their maximum multiplier possible
			if (multiplier <= -4) { //TODO: should be based on config
				this.sound.maxMultiplierLost();
			}
		}
	},
	created: function () {
		if (!this.connection.connected()) {
			this.$router.push({path: "/", query: {gameId: this.gameId}});
			return;
		}

		this.connection.onPlayersChange().then(newPlayers => {
			return playerConnected(this, newPlayers);
		});

		this.connection.onCategorySelect().then(data => {
			return showCategorySpinner(this, data.categories, data.correct, data.index, data.total, data.ttsId);
		});

		this.connection.onQuestion().then(data => {
			return displayQuestion(this, data.text, data.view, data.ttsId);
		});

		this.connection.onQuestionError().then(message => {
			return displayError(this, message);
		});

		this.connection.onQuestionStart().then(data => {
			return playbackStart(this, data.view, data.answers);
		});

		this.connection.onQuestionEnd().then(data => {
			return playbackEnd(this, data.pointsThisRound, data.correct);
		});

		this.connection.onPlayerGuessed().then(id => {
			return playerGuessed(this, id);
		});

		this.connection.onTimerTick().then(data => {
			return timerTicked(this, data.timeLeft, data.percentageLeft, data.currentScore);
		});

		this.connection.onGameEnd().then(data => {
			return gameEnded(this, data.history, data.results);
		});
	}
};
</script>

<style lang="scss">
@use "../../../common/css/colors" as triviacolors;

.question {
	#content, #category-spinner {
		bottom: 10em;
		left: 2em;
		position: fixed;
		right: 2em;
		text-align: center;
		top: 6em;
	}

	#content.pre-question {
		iframe {
			opacity: 0;
		}
	}

	.title {
		color: triviacolors.$font;
		font-size: 3em;
		font-size: 6em;
		font-weight: bold;
		text-align: center;
		text-shadow: 0.025em 0.025em 0.025em grey;
		transform: scale(0.5) translateY(-50%);

		&.full-animation {
			animation: resize-title 3s linear normal forwards;
			display: block;
			opacity: 1;
			position: fixed;
			top: 50%;
			transform: scale(2) translateY(-50%);
			width: 100%;
		}

		&.full-static {
			display: block;
			opacity: 1;
			position: fixed;
			top: 50%;
			transform: translateY(-50%);
			width: 100%;
		}
	}

	#correct {
		animation: resize-correct 1s linear normal;
		color: triviacolors.$font;
		font-size: 3em;
		font-size: 6em;
		font-weight: bold;
		position: fixed;
		text-align: center;
		text-align: center;
		text-shadow: 0.025em 0.025em 0.025em grey;
		top: 50%;
		transform: translateY(-50%);
		width: 100%;
		z-index: 3;
		vertical-align: middle;
	}

	.index {
		left: 0.5em;
		position: fixed;
		top: 0.75em;
		font-size: 1.35em;
	}

	.timer {
		position: fixed;
		right: 0.5em;
		top: 0.75em;
		font-size: 1.35em;
	}

	.top {
		position: fixed;
		width: 100%;
		z-index: 2;
	}

	.bottom {
		bottom: 0;
		position: fixed;
		text-align: center;
		width: 100%;
	}

	.error .message {
		font-size: 2em;
	}
}

@keyframes resize-title {
	0% {
		transform: scale(0.5) translateY(-50%);
	}
	10% {
		transform: scale(2) translateY(-50%);
	}
	20% {
		transform: scale(1) translateY(-50%);
	}
	90% {
		transform: scale(1) translateY(-50%);
	}
	100% {
		transform: scale(1) translateY(-50%);
	}
}

@keyframes resize-correct {
	0% {
		transform: translateY(-50%) translateX(250%) skew(-45deg, 0deg);
	}
	75% {
		transform: translateY(-50%) translateX(0) skew(-20deg, 0deg);
	}
	100% {
		transform: translateY(-50%) translateX(0) skew(0);
	}
}
</style>