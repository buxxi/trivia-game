export default {
	data: function() { return({
		config: {
			questions : 25,
			time : 30,
			pointsPerRound : 1000,
			stopOnAnswers : true,
			allowMultiplier : true,
			maxMultiplier : 5,
			sound : {
				backgroundMusic : true,
				soundEffects : true,
				text2Speech : true
			},
			categories : {},
			fullscreen : false,
			categorySpinner : true
		},
		carouselIndex : 0,
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
			if (this.players.length == 0) {
				return "Not enough players";
			}
	
			var enabledCategories = Object.keys(this.config.categories).filter((cat) => this.config.categories[cat]);
			if (enabledCategories.length == 0) {
				return "Not enough categories selected";
			}

			var allPreloaded = this.availableCategories.filter(c => c.type in enabledCategories).map((cat) => cat.preload.done).reduce((pre, cur) => pre && cur, true);
	
			if (!allPreloaded) {
				return "Not all selected categories has preloaded";
			} else {
				return undefined;
			}
		}
	},
	created: async function() {
		let app = this;
		app.carouselTimeout = 0;

		function moveCarousel() {
			app.carouselTimeout = setInterval(() => {
				app.carouselIndex = (app.carouselIndex + 1) % app.poweredBy.length;
			}, 5000);
		}
		
		this.sound.pause();

		try {
			this.gameId = await this.connection.connect(this.preferredGameId);
			let clientUrl = new URL("../client#", document.location) + "?gameId=" + this.gameId; 
			this.qrUrl = await QRCode.toDataURL(clientUrl, {width: 400, height: 400});
			let categories = await this.connection.loadCategories();
			this.availableCategories = categories.map(c => new CategorySelector(c));
			this.poweredBy = categories.flatMap(c => c.attribution);
		} catch (e) {
			console.log(e);
			this.message = "Error when loading initial setup: " + e.message;
		}

		this.connection.onPlayersChange(async newPlayers => {
			for (let id in this.players) {
				this.$delete(this.players, id);
			}

			for (let id in newPlayers) {
				this.$set(this.players, id, new PlayerData(newPlayers[id]));
			}	
		});

		moveCarousel();
	},
	methods: {
		kickPlayer: async function(id) {
			await this.connection.removePlayer(id);
			delete this.players[id];
		},
		toggleFullScreen: function() {
			var fullScreenMode = () => document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
			var notify = () => {
				this.config.fullscreen = fullScreenMode();
				document.removeEventListener("fullscreenchange", notify);
				document.removeEventListener("webkitfullscreenchange", notify);
				document.removeEventListener("mozfullscreenchange", notify);
			}
			document.addEventListener("fullscreenchange", notify);
			document.addEventListener("webkitfullscreenchange", notify);
			document.addEventListener("mozfullscreenchange", notify);
			if (fullScreenMode()) {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen();
				}
			} else {
				var e = document.documentElement;
				if (e.requestFullscreen) {
					e.requestFullscreen();
				} else if (e.mozRequestFullScreen) {
					e.mozRequestFullScreen();
				} else if (e.webkitRequestFullScreen) {
					e.webkitRequestFullScreen();
				}
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
			}
			preload.running = false;
		},
		loadAll: async function() {
			for (let type of this.availableCategories.map(c => c.type)) {
				this.config.categories[type] = true;
				await this.preload(type);
			}
		},
		clearCache: async function() {
			try {
				for (let type of this.availableCategories.map(c => c.type)) {
					this.config.categories[type] = false;
				}
				await this.connection.clearCache();
			} catch (e) {
				this.message = "Failed to clear caches: " + e.message;
			}
		},
		startGame: function() {
			try {
				this.sound.config(this.config.sound);
				clearInterval(this.carouselTimeout);
				this.sound.play();
				this.connection.clearListeners();
				this.$router.push({name: 'game', params: { gameId: this.gameId, players: this.players } }, () => {
					this.connection.startGame(this.config);
				});
			} catch (e) {
				this.message = "Failed to start game: " + e.message;
			}
		}
	}
};

class PlayerData {
	constructor(player) {
		this.name = player.name;
		this.color = player.color;
		this.avatar = player.avatar;
	}
}

class CategorySelector {
	constructor(c) {
		this.type = c.type;
		this.name = c.name,
		this.icon = c.icon,
		this.static = c.static,
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
