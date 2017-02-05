triviaApp.service('videogames', function($http, youtube, apikeys) {
	function VideoGameQuestions() {
		var self = this;
		var platforms = {};
		var games = [];

		var MINIMUM_PLATFORM_GAMES = 50;
		var GAMES_PER_PLATFORM = 50;

		var types = {
			screenshot : {
				title : function(correct) { return "What game is this a screenshot of?" },
				correct : randomGame,
				similar : similarGames,
				view : screenshot,
				format : gameTitle,
				weight : 45
			},
			year : {
				title : function(correct) { return "In which year was '" + correct.name + "' first released?" },
				correct : randomGame,
				similar : similarGameYears,
				view : blank,
				format : gameYear,
				weight : 10
			},
			platform : {
				title : function(correct) { return "'" + correct.name + "' was released to one of these platforms, which one?" },
				correct : randomGame,
				similar : similarPlatforms,
				view : blank,
				format : gamePlatform,
				weight : 10
			},
			platform_year : {
				title : function(correct) { return "In which year was the system '" + correct.name + "' released?" },
				correct : randomPlatform,
				similar : similarPlatformYears,
				view : blank,
				format : platformYear,
				weight : 10
			},
			song : {
				title : function(correct) { return "From which games soundtrack is this song?" },
				correct : randomGameWithSong,
				similar : similarGames,
				view : songVideo,
				format : gameTitle,
				weight : 25
			}
		}

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
					var loadPlatforms = Object.keys(platforms).filter(function(p) { return platforms[p].games >= MINIMUM_PLATFORM_GAMES; });
					var total = loadPlatforms.length * GAMES_PER_PLATFORM;

					progress(games.length, total);

					var promises = loadPlatforms.map(function(platform) {
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
						loadVideos(progress, cache).then(function(videos) {
							parseTitles(videos).filter(function(t) {
								games.forEach(function(g) {
									if (compareAlphaNumeric(g.name, t.title)) {
										g.songs = g.songs || [];
										g.songs.push(t.id);
									}
								});
							})
							resolve();
						}).catch(reject);
					});
				});
			});
		}

		self.nextQuestion = function(selector) {
			return new Promise(function(resolve, reject) {
				var type = selector.fromWeightedObject(types);
				var correct = type.correct(selector);
				var similar = type.similar(correct, selector);

				resolve({
					text : type.title(correct),
					answers : selector.alternatives(similar, correct, type.format, selector.first),
					correct : type.format(correct),
					view : type.view(correct, selector)
				});
			});
		}

		function loadVideos(progress, cache) {
			return cache.get('songs', function(resolve, reject) {
				youtube.loadChannel('UC6iBH7Pmiinoe902-JqQ7aQ', progress).then(resolve).catch(reject);
			});
		}

		function loadGames(platform, cache) {
			return cache.get(platform, function(resolve, reject) {
				$http.get('https://igdbcom-internet-game-database-v1.p.mashape.com/games/', {
					params : {
						fields : 'name,url,first_release_date,release_dates,screenshots,keywords,themes,genres',
						limit : GAMES_PER_PLATFORM,
						offset : 0,
						order : 'rating:desc',
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
						return {
							name : game.name,
							release_date : release_date(game.first_release_date),
							screenshots : game.screenshots.map(function(ss) { return ss.cloudinary_id; }),
							platforms : game.release_dates.map(function(rd) { return platforms[rd.platform] ? platforms[rd.platform].name : null; }).filter(function(p, i, arr) { return p != null && arr.indexOf(p) == i; }),
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
						fields : 'name,generation,games,versions.release_dates.date',
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
							if (!platform.versions) {
								platform.versions = [];
							}
							var release_dates = platform.versions.map(function(v) {
								return v.release_dates ? v.release_dates.map(function(d) { return d.date; }) : []
							}).reduce(function(a, b) {
								return [].concat(a).concat(b);
							}, []);

							object[platform.id] = {
								name : platform.name,
								generation : platform.generation,
								games : platform.games ? platform.games.length : 0,
								release_date : release_date(release_dates.length > 0 ? release_dates.reduce(function(a, b) { return a < b ? a : b }) : 0)
							}
						});
						resolve(object);
					}
				};

				loadPage(0).then(callback);
			});
		}

		function parseTitles(videos) {
			return videos.map(function(v) {
				var match = v.title.match(/Best VGM [0-9]+ - (.*?)( - ).*/);
				if (!match) {
					return null;
				}

				return {
					id : v.id,
					title : match[1]
				};
			}).filter(function(v) { return v != null; });
		}

		function compareAlphaNumeric(str1, str2) {
			var x = /[^a-z0-9]/g;
			var a = str1.toLowerCase().replace(x, '')
			var b = str2.toLowerCase().replace(x, '');

			return a == b;
		}

		function randomGame(selector) {
			return selector.fromArray(games);
		}

		function randomGameWithSong(selector) {
			return selector.fromArray(games.filter(function(g) { return g.songs }));
		}

		function randomPlatform(selector) {
			function hasDate(p) {
				return p.release_date != new Date(0).toISOString();
			};
			return selector.fromArray(Object.keys(platforms).map(function(p) {return platforms[p]}).filter(hasDate));
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

		function similarGameYears(game, selector) {
			return selector.yearAlternatives(gameYear(game), 3).map(function(year) { return { release_date : year }; });
		}

		function similarPlatformYears(platform, selector) {
			return selector.yearAlternatives(platformYear(platform), 3).map(function(year) { return { release_date : year }; });
		}

		function similarPlatforms(game, selector) {
			function dateDifference(a, b) {
				return selector.dateDistance(a.release_date, game.release_date) - selector.dateDistance(b.release_date, game.release_date);
			}

			var unused = Object.keys(platforms).map(function(p) { return platforms[p] }).filter(function(p) { return game.platforms.indexOf(p) == -1}).sort(dateDifference);

			return [
				{ platforms : [selector.splice(unused).name] },
				{ platforms : [selector.splice(unused).name] },
				{ platforms : [selector.splice(unused).name] }
			]
		}

		function screenshot(game, selector) {
			return {
				player : 'image',
				url : 'https://res.cloudinary.com/igdb/image/upload/t_screenshot_huge/' + selector.fromArray(game.screenshots) + '.jpg',
				attribution : {
					title : "Screenshot of",
					name : gameTitle(game) + " (" + gameYear(game) + ")",
					links : [game.attribution]
				}
			}
		}

		function songVideo(game, selector) {
			var videoId = selector.fromArray(game.songs);

			return {
				player : 'youtubeaudio',
				videoId : videoId,
				attribution : {
					title : "Music from",
					name : gameTitle(game) + " (" + gameYear(game) + ")",
					links : [game.attribution, 'http://www.youtube.com/watch?v=' + videoId]
				}
			}
		}

		function blank(game, selector) {
			return {
				attribution : {
					title : "Featured game",
					name : gameTitle(game) + " (" + gameYear(game) + ")",
					links : [game.attribution]
				}
			}
		}

		function gameTitle(game) {
			return game.name;
		}

		function gameYear(game) {
			return new Date("" + game.release_date).getFullYear();
		}

		function platformYear(platform) {
			return new Date("" + platform.release_date).getFullYear();
		}

		function gamePlatform(game) {
			return game.platforms[0];
		}

		function release_date(time) {
			try {
				return new Date(time).toISOString();
			} catch (e) {
				return new Date(0).toISOString();
			}
		}
	}

	return new VideoGameQuestions();
});

