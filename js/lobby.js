function LobbyController($rootScope, $scope, $location, $routeParams, connection, game, categories, sound, avatars, fingerprint, config) {
	var carouselTimeout = 0;

	//TODO: maybe move the preloading status into the categories-service instead? It's now in rootScope to avoid problems when playing second game
	if (!$rootScope.preloading) {
		$rootScope.preloading = {};
	}

	if ($routeParams.forcePairCode) { //For debugging easier and making it easier for people without QR reader
		fingerprint.get = function(callback) {
			callback($routeParams.forcePairCode);
		}
	}
	
	if ($routeParams.fakePlayers) { //For debugging layout
		for (var i = 1; i <= $routeParams.fakePlayers; i++) {
			game.addPlayer(i, "Fake" + i);
		}
	}

	let app = new Vue({
		el: '.lobby',
		data: {
			carouselIndex : 0,
			code: undefined,
			config: config,
			availableCategories: [],
			categories: categories,
			serverUrl: window.location.hostname + "/trivia",
			avatars: avatars,
			players: [],
			poweredBy: [],
			preloading: $rootScope.preloading,
			message : undefined
		},
		computed: {
			qrUrl: function() { 
				let localUrl = encodeURIComponent(window.location.href.replace('server.html', 'client.html') + "?code=" + this.code); 
				return `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${localUrl}&choe=UTF-8`;
			},
			playerCount: function() { 
				return this.players.length; 
			},
			questionCount: function() { 
				return this.categories.countQuestions(this.config.categories); 
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
		methods: {
			kickPlayer: function(player) {
				game.removePlayer(player.pairCode);
				connection.close(player.pairCode);	
				refreshPlayers();		
			},
			usingFallbackConnection: function(player) {
				return connection.usingFallback(player.pairCode);
			},		
			hasConnectionError: function(player) {
				return connection.connectionError(player.pairCode);
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
			preload: function(type) {
				if (this.preloading[type]) {
					return new Promise((resolve, reject) => resolve());
				}
		
				this.preloading[type] = true;
				let preload = this.availableCategories.find(c => c.type == type).preload;

				return new Promise((resolve, reject) => {
					function updateProgress(current, total) {
						preload.current = current;
						preload.total = total;
					}

					categories.preload(type, updateProgress, game).then(() => {
						preload.done = true;
						resolve();
					}).catch((err) => {
						console.log(err);
						preload.failed = true;
					});
				});
			},
			preloadPercentage: function(preload) {
				return Math.ceil(preload.current / Math.max(preload.total, 1) * 100);
			},
			preloadShowProgress: function(preload) {
				return !preload.done || !preload.failed;
			},
			preloadingDone: function(preload) {
				return preload && preload.done;
			},
			preloadingFailed: function(preload) {
				return preload && preload.failed;
			},
			loadAll: async function() {
				for (let type of this.availableCategories.map(c => c.type)) {
					this.config.categories[type] = true;
					await this.preload(type);
				}
			},
			clearCache: function() {
				for (let type of this.availableCategories.map(c => c.type)) {
					this.config.categories[type] = false;
					delete this.preloading[type];
				}
				categories.clearCache();
			},
			startGame: function() {
				sound.play();
				game.configure();
				connection.disconnect();
				clearInterval(carouselTimeout);
				$scope.$apply(() => {
					$location.path('/game');
				});
			},
			addCategories: function(files) {
				for (var i = 0; i < files.length; i++) {
					categories.loadFromFile(files[i]).then((type) => {
						this.availableCategories.push(new CategorySelector(categories.available().find(c => c.type == type)));
						this.preload(type);
						this.config.categories[type] = true;
					});
				}
			}
		}
	});

	function moveCarousel() {
		carouselTimeout = setInterval(() => {
			app.carouselIndex = (app.carouselIndex + 1) % app.poweredBy.length;
		}, 5000);
	}

	function refreshPlayers() {
		let players = game.players();
		app.players = Object.keys(players).map(pairCode => new LobbyPlayer(pairCode, players[pairCode]));
	}

	connection.host((data) => {
		game.addPlayer(data.pairCode, data.name, data.avatar);
		refreshPlayers();
	}).then((code) => {
		app.code = code;
		connection.on("connection-upgraded", refreshPlayers);
		connection.on("connection-closed", refreshPlayers);
	}).catch((err) => {
		app.message = "Error when creating connection: " + err;
	});

	categories.init().then(() => {
		app.availableCategories = categories.available().map(c => new CategorySelector(c));
		app.poweredBy = categories.attribution();
		moveCarousel();
		refreshPlayers();
	});

	class LobbyPlayer {
		constructor(pairCode, p) {
			this.pairCode = pairCode;
			this.name = p.name;
			this.avatar = p.avatar;
			this.color = p.color;
		}
	}

	class CategorySelector {
		constructor(c) {
			this.type = c.type;
			this.name = c.name,
			this.icon = c.icon,
			this.static = c.static,
			this.preload = {
				current : 0,
				total : 0,
				done : false,
				failed : false,
			}
		}
	}
}
