<template>
<div class="lobby">
	<div class="connect">
		<h1>{{ $t('title') }}</h1>
		<div>
			<div class="qr">
				<img v-if="gameId != null" v-bind:src="qrUrl" alt=""/>
				<i v-if="gameId == null" class="fas fa-cog fa-spin fa-fw"></i>
			</div>
			<div class="code" v-if="gameId != null">{{ gameId }}</div>
			<div class="code" v-if="gameId == null">{{ $t('loading') }}...</div>
		</div>
		<div class="instructions" v-bind:data-url="serverUrl">
			<div>
				<h3>{{ $t('join.header') }}</h3>
				{{ $t('join.qrCodeOrUrl') }}:<br/>
				<b>{{serverUrl}}</b>
			</div>
		</div>
	</div>
	<div class="players">
		<h1><i class="fas fa-fw fa-users"></i>{{ $t('players.header') }}</h1>
		<p v-if="Object.entries(players).length === 0">{{ $t('players.none')}}</p>
		<ul class="playerlist" v-if="Object.entries(players).length > 0">
			<li v-for="(player, id) in players">
				<a v-on:click="kickPlayer(id)" class="kick" v-bind:title="$t('players.kick')">
					<div class="avatar" v-bind:data-ping="player.ping" v-bind:data-score="player.name" v-bind:style="{'background-color': player.color, 'border-color': player.color}">
            <img v-bind:src="'../common/img/avatars/' + player.avatar + '.png'" alt=""/>
          </div>
				</a>
			</li>
		</ul>

		<div class="rules">
			<h1><i class="fas fa-fw fa-gavel"></i>{{ $t('rules.header') }}</h1>
			<ol>
				<li>{{ $t('rules.controller') }}</li>
				<li>{{ $t('rules.scoring', {lossPercentage: config.lossPercentage}) }}</li>
				<li>{{ $t('rules.belowZero') }}</li>
				<li>{{ $t('rules.speed') }}</li>
				<li v-if="config.allowMultiplier">{{ $t('rules.multiplier.correct', {maxMultiplier: config.maxMultiplier }) }}</li>
				<li v-if="config.allowMultiplier">{{ $t('rules.multiplier.incorrect') }}</li>
				<li v-if="config.allowMultiplier">{{ $t('rules.multiplier.unanswered') }}</li>
        <li>
            <i18next :translation="$t('rules.time')" >
                <template #seconds><b>{{config.time}}</b></template>
            </i18next>
        </li>
			</ol>

			<h1><i class="fas fa-fw fa-heart" style="color : #aa0000"></i>{{ $t('poweredBy') }}</h1>
			<ul class="carousel">
				<li v-for="(site, index) in poweredBy" v-bind:class="{show : index === carouselIndex}"><a v-bind:href="site.url">{{ site.name }}</a></li>
			</ul>
		</div>
	</div>
	<div class="settings">
		<h1><i class="fas fa-fw fa-cogs"></i>{{ $t('settings.header') }}</h1>
		<div>
			<form>
				<div class="general">
					<div class="numeric-input">
						<label for="questions" v-bind:title="$t('settings.questions')"><i class="fas fa-fw fa-question"></i></label>
						<input type="number" id="questions" step="5" min="5" v-model="config.questions">
					</div>

					<div class="numeric-input">
						<label for="time" v-bind:title="$t('settings.time')"><i class="fas fa-fw fa-hourglass"></i></label>
						<input type="number" id="time" step="5" min="5" v-model="config.time">
					</div>

					<div class="numeric-input">
						<label for="points" v-bind:title="$t('settings.pointsPerRound')"><i class="fas fa-fw fa-star"></i></label>
						<input type="number" id="points" step="100" min="100" v-model="config.pointsPerRound">
					</div>

					<div class="numeric-input" v-if="config.allowMultiplier">
						<label for="maxMultiplier" v-bind:title="$t('settings.maxMultiplier')"><i class="fas fa-fw fa-times"></i></label>
						<input type="number" id="maxMultiplier" step="1" min="1" v-model="config.maxMultiplier">
					</div>

          <div class="numeric-input">
              <label for="lossPercentage" v-bind:title="$t('settings.lossPercentage')"><i class="fas fa-fw fa-arrow-trend-down"></i></label>
              <input type="number" id="lossPercentage" step="10" min="0" max="100" v-model="config.lossPercentage">%
          </div>

					<ul class="circle-checkboxes">
						<li v-bind:class="{'selected' : config.stopOnAnswers}">
							<label for="stop" v-bind:title="$t('settings.stopOnAnswers')"><input type="checkbox" id="stop" v-model="config.stopOnAnswers"><span class="icon"><i class="fas fa-stop"></i></span></label>
						</li>
						<li v-bind:class="{'selected' : config.allowMultiplier}">
							<label for="multiplier" v-bind:title="$t('settings.allowMultiplier')"><input type="checkbox" id="multiplier" v-model="config.allowMultiplier"><span class="icon"><i class="fas fa-times"></i></span></label>
						</li>
						<li v-bind:class="{'selected' : config.sound.backgroundMusic}">
							<label for="backgroundMusic" v-bind:title="$t('settings.backgroundMusic')"><input type="checkbox" id="backgroundMusic" v-model="config.sound.backgroundMusic"><span class="icon"><i class="fas fa-music"></i></span></label>
						</li>
						<li v-bind:class="{'selected' : config.sound.text2Speech}">
							<label for="text2Speech" v-bind:title="$t('settings.text2Speech')"><input type="checkbox" id="text2Speech" v-model="config.sound.text2Speech"><span class="icon"><i class="fas fa-comment"></i></span></label>
						</li>
						<li v-bind:class="{'selected' : config.sound.soundEffects}">
							<label for="soundEffects" v-bind:title="$t('settings.soundEffects')"><input type="checkbox" id="soundEffects" v-model="config.sound.soundEffects"><span class="icon"><i class="fas fa-exclamation"></i></span></label>
						</li>
						<li v-bind:class="{'selected' : config.categorySpinner}">
							<label for="spinner" v-bind:title="$t('settings.categorySpinner')"><input type="checkbox" id="spinner" v-model="config.categorySpinner"><span class="icon"><i class="fas fa-spinner"></i></span></label>
						</li>
						<li v-bind:class="{'selected' : config.saveStatistics}">
							<label for="statistics" v-bind:title="$t('settings.saveStatistics')"><input type="checkbox" id="statistics" v-model="config.saveStatistics"><span class="icon"><i class="fas fa-chart-simple"></i></span></label>
						</li>
						<li v-bind:class="{'selected' : config.fullscreen}">
							<label for="fullscreen" v-bind:title="$t('settings.fullscreen')"><input type="checkbox" id="fullscreen" v-model="config.fullscreen" v-on:change="toggleFullScreen()"><span class="icon"><i class="fas fa-window-maximize"></i></span></label>
						</li>
            <li class="selected">
                <label for="language" v-bind:title="$t('settings.language')"><input type="checkbox" id="language" v-on:click="nextLanguage()"><span class="icon"><i>{{config.language.toUpperCase()}}</i></span></label>
            </li>
					</ul>
				</div>

				<div id="categories">
					<h1><i class="fas fa-fw fa-list-ul"></i>{{ $t('categories.header') }}</h1>
					<ul class="circle-checkboxes" v-bind:class="{'list-view': listView}">
						<li v-bind:class="{'selected' : config.categories[category.type] && category.preload.done, 'loaded' : !config.categories[category.type] && category.preload.done, 'failed' : category.preload.failed}" v-for="category in sortedCategories">
							<label v-bind:title="category.name" v-on:contextmenu.prevent="clearCache(category.type)">
								<input type="checkbox" v-bind:id="category.type" v-model="config.categories[category.type]" v-on:change="preload(category.type)">
								<span class="icon">
                    <i v-if="category.icon.indexOf('url:') === -1" v-bind:class="['fa',category.icon]"></i>
                    <img v-if="category.icon.indexOf('url:') === 0" v-bind:src="category.icon.substring(4)" alt=""/>
                </span>
							</label>
							<div class="progress" v-if="config.categories[category.type] && !category.preload.done && !category.preload.failed">{{ category.preloadPercentage() }}%</div>
						</li>
					</ul>

					<div class="buttons">
						<button v-on:click.prevent="loadAll()"><i class="fas fa-spinner"></i> {{ $t('categories.selectAll') }}</button>
						<button v-on:click.prevent="loadRandom()"><i class="fas fa-random"></i> {{ $t('categories.selectRandom') }}</button>
            <button v-on:click.prevent="toggleListView()"><i class="fas fa-list"></i> {{ $t('categories.toggleListView') }}</button>
					</div>

					<div class="questionCount">
              <span>
                  <i18next :translation="$t('categories.questionCount')">
                      <template #questionCount><b>{{questionCount}}</b></template>
                  </i18next>
              </span>
					</div>
				</div>
			</form>
		</div>
	</div>

	<div v-if="message">
		<div class="message">{{ message }}</div>
	</div>
	<div id="start">
		<a v-on:click="startGame()" v-bind:class="startMessage !== undefined ? 'disabled' : undefined" v-bind:title="startMessage !== undefined ? $t(startMessage) : $t('ready')"><i class="fas fa-fw fa-play"></i></a>
	</div>
</div>
</template>

<script>
import { useTranslation } from "i18next-vue";
import {qrcode} from "qrcode-generator";
import logger from '../../../common/js/browser-logger.mjs';

class PlayerData {
	constructor(player) {
		this.name = player.name;
		this.color = player.color;
		this.avatar = player.avatar;
		this.ping = 0;
	}
}

class CategorySelector {
	constructor(c) {
		this.type = c.type;
		this.name = c.name;
		this.icon = c.icon;
		this.attribution = c.attribution;
		this.questionCount = 0;
		this.preload = {
			current : 0,
			total : 0,
			done : false,
			running: false,
			failed : false,
		}
	}

	preloadPercentage() {
		return Math.ceil(this.preload.current / Math.max(this.preload.total, 1) * 100);
	}
}

export default {
	data: function() { return {
		config: {
			questions : 25,
			time : 30,
			pointsPerRound : 1000,
			stopOnAnswers : true,
			allowMultiplier : true,
			maxMultiplier : 5,
			lossPercentage: 100,
			saveStatistics: true,
			sound : {
				backgroundMusic : true,
				soundEffects : true,
				text2Speech : true
			},
			categories : {},
			fullscreen : false,
			categorySpinner : true,
			language: undefined
		},
		carouselIndex : 0,
		i18n: undefined,
		gameId: undefined,
		availableCategories: [],
		serverUrl: new URL("..", document.location).toString(),
		poweredBy: [],
		message : undefined,
		players: {},
		qrUrl: undefined,
		listView: false
	}},
	props: ['connection', 'sound', 'preferredGameId'],
	computed: {
		questionCount: function() {
			return this.availableCategories.filter(c => this.config.categories[c.type]).map(c => c.questionCount).reduce((a, b) => a + b, 0);
		},
		startMessage: function() {
			if (Object.keys(this.players).length === 0) {
				return "players.none";
			}

			var enabledCategories = Object.keys(this.config.categories).filter((cat) => this.config.categories[cat]);
			if (enabledCategories.length === 0) {
				return "categories.none";
			}

			var allPreloaded = this.availableCategories.filter(c => c.type in enabledCategories).map((cat) => cat.preload.done).reduce((pre, cur) => pre && cur, true);

			if (!allPreloaded) {
				return "categories.stillLoading";
			} else {
				return undefined;
			}
		},
		sortedCategories: function() {
			if (this.listView) {
				return this.availableCategories.toSorted((a, b) => a.name.localeCompare(b.name));
			} else {
				return this.availableCategories;
			}
		}
	},
	created: async function() {
		let app = this;
		app.carouselTimeout = 0;
		app.i18n = useTranslation();
		app.config.language = app.i18n.i18next.language;

		function moveCarousel() {
			app.carouselTimeout = setInterval(() => {
				app.carouselIndex = (app.carouselIndex + 1) % app.poweredBy.length;
			}, 5000);
		}

		this.sound.pauseBackgroundMusic();

		try {
			this.gameId = await this.connection.connect(this.preferredGameId);
			let clientUrl = new URL("../client#", document.location) + "?gameId=" + this.gameId;
			let qr = qrcode(0, 'L');
			qr.addData(clientUrl);
			qr.make();
			this.qrUrl = qr.createDataURL(10, 30);
			await this.connection.changeLanguage(this.i18n.i18next.language);
			await this.loadCategories();
		} catch (e) {
			logger.error(e);
			this.message = this.i18n.t("errors.initial", {message: e.message});
		}

		this.connection.onPlayersChange().then(async newPlayers => {
			for (let id in this.players) {
				delete this.players[id];
			}

			for (let id in newPlayers) {
				this.players[id] = new PlayerData(newPlayers[id]);
			}
		});

		this.connection.onPing().then(async pings => {
			Object.entries(pings).forEach(([id, ping]) => {this.players[id].ping = ping;});
		})

		moveCarousel();
	},
	methods: {
		nextLanguage: async function() {
			let languages = Object.keys(this.i18n.i18next.store.data);
			let i = (languages.indexOf(this.config.language) + 1) % languages.length;
			this.config.language = languages[i];
			this.i18n.i18next.changeLanguage(this.config.language);
			await this.connection.changeLanguage(this.config.language);
			await this.loadCategories();
		},

		loadCategories: async function() {
			let categories = await this.connection.loadCategories(this.config.language);
			this.availableCategories = categories.map(c => new CategorySelector(c));
			this.poweredBy = categories.flatMap(c => c.attribution);
			this.config.categories = {};
		},

		kickPlayer: async function(id) {
			await this.connection.removePlayer(id);
			delete this.players[id];
		},
		toggleFullScreen: function() {
			let fullScreenMode = () => !!document.fullscreenElement;
			let notify = () => {
				this.config.fullscreen = fullScreenMode();
			}
			document.addEventListener("fullscreenchange", notify);
			if (fullScreenMode()) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
		},
		preload: async function(type) {
			let category = this.availableCategories.find(c => c.type === type);
			let preload = category.preload;

			if (preload.running || !this.config.categories[type]) {
				return;
			}

			preload.running = true;

			function updateProgress(current, total) {
				preload.current = current;
				preload.total = total;
			}

			try {
				category.questionCount = await this.connection.preloadCategory(type, updateProgress);
				preload.done = true;
			} catch (e) {
				logger.error(e);
				preload.failed = true;
				delete this.config.categories[type];
			}
			preload.running = false;
		},
		loadAll: async function() {
			try {
				for (let type of this.availableCategories.map(c => c.type)) {
					this.config.categories[type] = true;
					await this.preload(type);
				}
			} catch (e) {
				logger.error(e);
			}
		},
		loadRandom: async function() {
			let possible = this.availableCategories.filter(c => !this.config.categories[c.type]);
			let rnd = possible.length * Math.random() << 0;
			this.config.categories[possible[rnd].type] = true;
			await this.preload(possible[rnd].type);
		},

		toggleListView: function() {
			this.listView = !this.listView;
		},

		clearCache: async function(category) {
			if (!confirm(this.i18n.t('categories.clearCache', {category : category}))) {
				return;
			}
			try {
				this.config.categories[category] = false;
				await this.connection.clearCache(category);
			} catch (e) {
				this.message = this.i18n.t('errors.clearCache', {message: e.message});
			}
		},
		startGame: async function() {
			try {
				this.sound.config(this.config.sound);
				clearInterval(this.carouselTimeout);
				this.sound.resumeBackgroundMusic();
				this.connection.clearListeners();

				await this.$router.push({name: 'game', query: { gameId: this.gameId, }, state: { players: JSON.stringify(this.players) }});
				this.connection.startGame(this.config);
			} catch (e) {
				this.message = this.i18n.t('errors.startGame', {message: e.message});
			}
		}
	}
};
</script>

