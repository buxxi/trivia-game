<template>
<div class="question" v-bind:class="{'timer-warning': timer.warning}">
	<div class="top">
			<div class="index">
				<div class="infobox" v-if="session.currentCategory && state !== 'loading'">
					<span class="current">{{ session.index }}</span>
					<span class="total">{{ session.total }}</span>
				</div>
				<div class="category infobox" v-if="session.currentCategory && state !== 'loading'">{{ session.currentCategory.fullName }}</div>
			</div>
			<div class="title" v-bind:class="{'full-animation' : state === 'pre-question', 'full-static' : (state === 'question' && !minimizeQuestion)}">
                <span v-if="state === 'post-question'">{{ $t('states.postQuestion') }}</span>
                <span v-else-if="state === 'error'">{{ $t('states.error') }}</span>
                <span v-else>{{ title }}</span>
            </div>
			<div class="timer" v-if="timer.running">
				<div class="timer-score infobox"><i class="fas fa-fw fa-star"></i>{{ timer.score }}</div>
				<div class="timer-counter" v-bind:data-seconds="timer.timeLeft" v-bind:data-percentage="timer.percentageLeft">
					<svg viewBox="0 0 38 38">
					  <circle id="border" r="15.9155" cx="19" cy="19"></circle>
					  <circle id="bar" r="15.9155" cx="19" cy="19" stroke-dasharray="100" v-bind:stroke-dashoffset="(100 - timer.percentageLeft )"></circle>
					</svg>
				</div>
			</div>
	</div>
	<div id="content" v-bind:class="state">
		<component v-bind:is="playbackPlayer" v-bind:view="playback.view" ref="playback"></component>
		<div class="message" v-if="state === 'error'">{{ error }}</div>
	</div>
	<div id="correct" v-if="state === 'post-question'" v-bind:class="'button-icon-' + correct['key']">{{ correct['answer'] }}</div>
	<div id="round" v-if="state === 'loading'" v-bind:data-round="$t('states.question', {index:session.index})"></div>
	<div id="category-spinner" v-if="state === 'loading'">
		<category-spinner ref="spinner" v-on:flip="sound.spinnerClick()" v-bind:categories="spinner.categories" v-bind:correct="session.currentCategory.name"/>
	</div>
	<div class="bottom">
		<transition-group name="playerPosition" tag="ul" class="playerlist">
			<li v-for="player in players" :key="player.id" v-bind:class="{'guessed' : player.guessed, 'score-change-positive': achievedPoints(player), 'score-change-negative': lostPoints(player)}">
				<img src="../../img/crown.png" class="leader" v-if="isLeadingPlayer(player)" alt=""/>
				<div class="avatar" v-bind:data-score="playerNameOrPoints(player)" v-bind:data-multiplier="player.multiplier" v-bind:style="{'background-color': player.color, 'border-color': player.color}">
					<img v-if="player.connected && !hidePlayers" v-bind:src="'../common/img/avatars/' + player.avatar + '.png'" alt=""/>
					<i v-if="player.connected && hidePlayers" class="fa-solid fa-question"></i>
					<i v-if="!player.connected" class="fa-solid fa-bolt"></i>
				</div>
			</li>
		</transition-group>
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
	app.session.update(index, total, correct);

	if (categories.length > 0) {
		app.spinner.categories = categories;
		for (let i = 0; i < categories.length; i++) {
			categories[i].index = i;
		}
		let spinner = await resolveRef(app, 'spinner');
		await spinner.start();
	}

	return app.sound.speak(app.gameId, ttsId, 1500, 250);
}

async function displayQuestion(app, text, view, ttsId) {
	app.state = 'pre-question';
	app.title = text;
	app.playback.view = view;
	await app.sound.speak(app.gameId, ttsId, 3000, 0);
}

function displayError(app, message) {
	return new Promise((resolve, _) => {
		app.playback.view = {};
		app.error = message;
		app.state = 'error';
		resolve();
	});
}

async function playbackStart(app, view, answers) {
	if (!view.player) {
		view.player = 'blank';
	}
	view.answers = answers;
	app.playback.view = view;

	let playback = await resolveRef(app, 'playback');

	await playback.start();

	app.state = 'question';
	app.minimizeQuestion = playback.minimizeQuestion;

	if (playback.pauseMusic) {
		app.sound.pauseBackgroundMusic();
	}
}

function playbackEnd(app, pointsThisRound, correct) {
	return new Promise(async (resolve, _) => {
		let playback = await resolveRef(app, 'playback');
		app.playback.view = {};
		playback.stop();

		app.timer.stop();
		app.sound.resumeBackgroundMusic();

		// Someone lost their multiplier
		if (Object.values(pointsThisRound).some(p => p.multiplier <= -4)) {
			app.sound.maxMultiplierLost();
		}

		// All correct
		if (Object.values(pointsThisRound).filter(p => p.points > 0).length === app.players.length) {
			app.sound.allGuessedCorrect();
		}

		app.correct = correct;
		app.state = 'post-question';

		app.players.forEach(player => {
			player.updatePoints(pointsThisRound[player.id]);
		});

		setTimeout(() => {
			app.players.forEach((player) => player.clearChanges());
			app.players.sort((a, b) => b.totalPoints - a.totalPoints);

			resolve();
		}, 3000);
	});
}

async function timerTicked(app, timeLeft, percentageLeft, currentScore) {
	app.timer.update(timeLeft, percentageLeft, currentScore, app.sound);
}

async function playerGuessed(app, id) {
	app.players.find(p => p.id === id).guessed = true;
	app.sound.playerGuessed(app.players.filter((p) => p.guessed).length);
}

async function playerConnected(app, newPlayers) {
	app.players.forEach(player => {
		player.connected = player.id in newPlayers;
	});
}

async function gameEnded(app, history, results) {
	app.connection.clearListeners();
	app.$router.push({ name: 'results', query: { gameId: app.gameId }, state: { results: JSON.stringify(results), history: JSON.stringify(history) } });
}

class PlayerData {
	constructor(id, player) {
		this.id = id;
		this.name = player.name;
		this.color = player.color;
		this.avatar = player.avatar;
		this.totalPoints = 0;
		this.pointChange = 0;
		this.multiplier = 1;
		this.guessed = false;
		this.connected = true;
	}

	updatePoints(pointChanges) {
		this.pointChange = pointChanges.points;
		this.multiplier += pointChanges.multiplier;
		this.guessed = false;
		this.totalPoints += pointChanges.points;
	}

	clearChanges() {
		this.pointChange = 0;
	}
}

class SessionData {
	constructor() {
		this.index = 0;
		this.total = 0;
		this.currentCategory = {
			name : undefined
		};
	}

	update(index, total, currentCategory) {
		this.index = index;
		this.total = total;
		this.currentCategory = currentCategory;
	}
}

class TimerData {
	constructor() {
		this.running = false;
		this.warning = false;
		this.score = 0;
		this.timeLeft = 0;
		this.percentageLeft = 0;
	}

	update(timeLeft, percentageLeft, currentScore, sound) {
		let previousWarning = this.warning;
		this.running = true;
		this.score = currentScore;
		this.timeLeft = timeLeft;
		this.percentageLeft = percentageLeft;
		this.warning = timeLeft <= 5;
		if (!previousWarning && this.warning) {
			sound.timerWarning();
		}
	}

	stop() {
		this.running = false;
		this.warning = false;
	}
}

export default {
	data: function() { return{
		spinner : {
			categories: []
		},
		playback : {
			view : {}
		},
		timer: new TimerData(),
		session: new SessionData(),
		title: '',
		state: 'loading',
		error: undefined,
		minimizeQuestion: false,
		players: [],
    correct: undefined
	}},
	props: ['gameId', 'connection', 'sound', 'lobbyPlayers'],
	computed: {
		hidePlayers: function() {
			return (this.state === 'pre-question' || this.state === 'question') && this.playback.view.hidePlayers;
		 },
		playbackPlayer: function() {
			if (!this.playback.view.player) {
				return undefined;
			}
			return this.playback.view.player + "-player";
		}
	},
  components: {
    CategorySpinner,
    AnswersPlayer,
    AudioPlayer,
    BlankPlayer,
    ImagePlayer,
    ListPlayer,
    QuotePlayer,
    VideoPlayer
  },
	created: function() {
		if (!this.connection.connected()) {
			this.$router.push({ path: "/", query: { gameId: this.gameId } });
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

		this.players = Object.entries(this.lobbyPlayers).map(entry => new PlayerData(entry[0], entry[1]));
	},
	methods: {
		isLeadingPlayer: function (player) {
			let playerScoreCount = this.players.filter((p) => p.totalPoints >= player.totalPoints).length;
			return playerScoreCount === 1;
		},
		achievedPoints: function (player) {
			return player.pointChange > 0;
		},
		lostPoints: function(player) {
			return player.pointChange < 0;
		},
		playerNameOrPoints: function(player) {
			if (this.achievedPoints(player) || this.lostPoints(player)) {
				return player.pointChange;
			}
			if (this.hidePlayers) {
				return "???";
			}
			if (this.timer.timeLeft % 10 >= 5) {
				return player.name;
			}
			return player.totalPoints;
		}
	}
};
</script>

