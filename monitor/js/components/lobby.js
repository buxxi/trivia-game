import { useTranslation } from "i18next-vue";
import {qrcode} from "qrcode-generator";

export default {
	data: function() { return({
		config: {
			questions : 25,
			time : 30,
			pointsPerRound : 1000,
			stopOnAnswers : true,
			allowMultiplier : true,
			maxMultiplier : 5,
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
		qrUrl: undefined
	})},
	props: ['connection', 'sound', 'preferredGameId'],
	computed: {
		questionCount: function() { 
			return this.availableCategories.filter(c => this.config.categories[c.type]).map(c => c.questionCount).reduce((a, b) => a + b, 0);
		},
		startMessage: function() {
			if (Object.keys(this.players).length == 0) {
				return "players.none";
			}
	
			var enabledCategories = Object.keys(this.config.categories).filter((cat) => this.config.categories[cat]);
			if (enabledCategories.length == 0) {
				return "categories.none";
			}

			var allPreloaded = this.availableCategories.filter(c => c.type in enabledCategories).map((cat) => cat.preload.done).reduce((pre, cur) => pre && cur, true);
	
			if (!allPreloaded) {
				return "categories.stillLoading";
			} else {
				return undefined;
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
		
		this.sound.pause();

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
			console.log(e);
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
			let category = this.availableCategories.find(c => c.type == type);
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
				console.log(e);
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
				console.log(e);
			}
		},
		loadRandom: async function() {
			let possible = this.availableCategories.filter(c => !this.config.categories[c.type]);
			let rnd = possible.length * Math.random() << 0;
			this.config.categories[possible[rnd].type] = true;
			await this.preload(possible[rnd].type);
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
				this.sound.play();
				this.connection.clearListeners();

				await this.$router.push({name: 'game', query: { gameId: this.gameId, }, state: { players: JSON.stringify(this.players) }});
				this.connection.startGame(this.config);
			} catch (e) {
				this.message = this.i18n.t('errors.startGame', {message: e.message});
			}
		}
	}
};

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
