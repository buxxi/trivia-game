<template>
<div class="lobby">
  <Connect :gameId="gameId"/>
	<div class="middle">
    <PlayersJoined :players="players" :pings="pings" v-on:playerKicked="kickPlayer"/>
    <Rules :allowMultiplier="config.allowMultiplier" :lossPercentage="config.lossPercentage" :maxMultiplier="config.maxMultiplier" :time="config.time"/>
    <Attribution :attributions="attributions"/>
	</div>
	<div class="settings">
		<h1><i class="fas fa-fw fa-cogs"></i>{{ $t('settings.header') }}</h1>
		<div>
			<form>
        <GeneralSettings :config="config" v-on:languageChanged="languageChanged"/>
        <CategorySettings :config="config" :categories="categories" v-on:preloadCategory="preloadCategory" v-on:clearCache="clearCache"/>
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
import logger from '../../../../common/js/browser-logger.mjs';
import Connect from './Connect.vue';
import Rules from "./Rules.vue";
import Attribution from "./Attribution.vue";
import PlayersJoined from "./PlayersJoined.vue";
import GeneralSettings from "./GeneralSettings.vue";
import CategorySettings from "./CategorySettings.vue";

export default {
  components: {CategorySettings, GeneralSettings, PlayersJoined, Attribution, Rules, Connect},
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
		i18n: undefined,
		gameId: undefined,
		categories: [],
		message : undefined,
		players: {},
    pings: {},
    preloadCount: 0
	}},
	props: ['connection', 'sound', 'preferredGameId'],
	computed: {
		startMessage: function() {
			if (Object.keys(this.players).length === 0) {
				return "players.none";
			}

			let enabledCategories = Object.keys(this.config.categories).filter((cat) => this.config.categories[cat]);
			if (enabledCategories.length === 0) {
				return "categories.none";
			}

			let allPreloaded = this.preloadCount === 0;

			if (!allPreloaded) {
				return "categories.stillLoading";
			} else {
				return undefined;
			}
		},
    attributions: function() {
      return this.categories.flatMap(c => c.attribution);
    }
	},
	created: async function() {
		let app = this;
		app.i18n = useTranslation();

		this.sound.pauseBackgroundMusic();

		try {
			this.gameId = await this.connection.connect(this.preferredGameId);
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
				this.players[id] = newPlayers[id];
			}
		});

		this.connection.onPing().then(async pings => {
      this.pings = pings;
		});
	},
	methods: {
    preloadCategory: async function(type, updateProgress, resolve, reject) {
      this.preloadCount++;
      try {
        let questionCount = await this.connection.preloadCategory(type, updateProgress);
        this.preloadCount--;
        resolve(questionCount);
      } catch (e) {
        reject(e);
      }
    },

    clearCache: async function(type, resolve, reject) {
      try {
        await this.connection.clearCache(type);
        resolve();
      } catch (e) {
        reject(e);
      }
    },

		languageChanged: async function(language) {
			await this.connection.changeLanguage(language);
			await this.loadCategories();
		},

		loadCategories: async function() {
			this.categories = await this.connection.loadCategories(this.config.language);
			this.config.categories = {};
      this.preloadCount = 0;
		},

		kickPlayer: async function(id) {
			await this.connection.removePlayer(id);
			delete this.players[id];
		},

		startGame: async function() {
			try {
				this.sound.config(this.config.sound);
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

