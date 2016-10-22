triviaApp.service('videogames', function($http, apikeys) {
	function VideoGameQuestions() {
		var self = this;
		var platforms = {};
		var games = [];

		self.describe = function() {
			return {
				type : 'videogames',
				name : 'Video Games',
				icon : 'fa-gamepad'
			};
		}

		self.preload = function(progress, cache) {
			return new Promise(function(resolve, reject) {
				loadPlatforms(cache).then(function(result) {
					platforms = result;
					var total = Object.keys(platforms).length * 50;

					progress(games.length, total);

					var promises = Object.keys(platforms).map(function(platform) {
						return loadGames(platform, cache);
					});

					for (var i = 0; i < (promises.length - 1); i++) {
						promises[i].then(function(data) {
							games = games.concat(data);
							progress(games.length, total);
							return promises[i + 1];
						});
					}
					promises[promises.length - 1].then(function(data) {
						games = games.concat(data);
						resolve();
					});
				});
			});
		}


		self.nextQuestion = function(selector) {
			return new Promise(function(resolve, reject) {
				var game = selector.fromArray(games);

				function resolveName(g) {
					return g.name;
				}

				var similar = similarGames(game, selector);
				resolve({
					text : "What game is this a screenshot of?",
					answers : selector.alternatives(similar, game, resolveName, selector.first),
					correct : resolveName(game),
					view : {
						player : 'image',
						url : 'https://res.cloudinary.com/igdb/image/upload/t_screenshot_huge/' + game.screenshots[0] + '.jpg',
						attribution : [game.attribution]
					}
				});
			});
		}

		function loadGames(platform, cache) {
			return cache.get(platform, function(resolve, reject) {
				$http.get('https://igdbcom-internet-game-database-v1.p.mashape.com/games/', {
					params : {
						fields : 'name,url,first_release_date,release_dates,screenshots,keywords,themes,genres',
						limit : 50,
						offset : 0,
						order : 'aggregated_rating:desc',
						'filter[screenshots][exists]' : '',
						'filter[release_dates.platform][eq]' : platform
					},
					headers : {
						'X-Mashape-Key' : apikeys.mashape
					}
				}).then(function(response) {
					function tag(prefix, arr) {
						if (!arr) {
							return [];
						}

						return arr.map(function(i) {
							return prefix + i;
						});
					}

					var games = response.data.map(function(game) {
						function release_date() {
							try {
								return new Date(game.first_release_date).toISOString();
							} catch (e) {
								return new Date(0).toISOString();
							}
						}

						return {
							name : game.name,
							release_date : release_date(),
							screenshots : game.screenshots.map(function(ss) { return ss.cloudinary_id; }),
							platforms : game.release_dates.map(function(rd) { return platforms[rd.platform] ? platforms[rd.platform].name : null; }).filter(function(p) { return p != null; }),
							tags : [].concat(tag('k', game.keywords)).concat(tag('t', game.themes)).concat(tag('g', game.genres)),
							attribution : game.url
						};
					});
					resolve(games);
				});
			});
		}

		function loadPlatforms(cache) {
			var loadPage = function(offset) {
				return $http.get('https://igdbcom-internet-game-database-v1.p.mashape.com/platforms/', {
					params : {
						fields : 'name,generation,games',
						limit : 50,
						offset : offset
					},
					headers : {
						'X-Mashape-Key' : apikeys.mashape
					}
				})
			};

			return cache.get('platforms', function(resolve, reject) {
				result = [];
				var callback = function(response) {
					result = result.concat(response.data);

					if (response.data.length == 50) {
						loadPage(result.length).then(callback);
					} else {
						var object = {};
						result.forEach(function(platform) {
							if (!platform.games || platform.games.length < 50) {
								return;
							}
							object[platform.id] = {
								name : platform.name,
								generation : platform.generation,
								games : platform.games ? platform.games.length : 0
							}
						});
						resolve(object);
					}
				};

				loadPage(0).then(callback);
			});
		}

		function similarGames(game, selector) {
			var titleWords = selector.wordsFromString(game.name);
			return games.map(function(g) {
				return {
					game : g,
					score : selector.levenshteinDistance(titleWords, selector.wordsFromString(g.name)) + selector.levenshteinDistance(game.tags, g.tags) + selector.dateDistance(game.release_date, g.release_date)
				};
			}).sort(function(a, b) {
				return a.score - b.score;
			}).map(function(node) {
				return node.game;
			});
		}
	}

	return new VideoGameQuestions();
});

