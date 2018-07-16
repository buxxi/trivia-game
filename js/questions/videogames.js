function VideoGameQuestions($http, youtube) {
	var self = this;
	var platforms = {};
	var games = [];

	var youtubeApiKey = '';
	var igdbApiKey = '';

	var MINIMUM_PLATFORM_GAMES = 50;
	var GAMES_PER_PLATFORM = 50;

	var types = {
		screenshot : {
			title : (correct) => "What game is this a screenshot of?",
			correct : randomGame,
			similar : similarGames,
			view : screenshot,
			format : gameTitle,
			weight : 45
		},
		year : {
			title : (correct) => "In which year was '" + correct.name + "' first released?",
			correct : randomGame,
			similar : similarGameYears,
			view : blank,
			format : gameYear,
			weight : 10
		},
		platform : {
			title : (correct) => "'" + correct.name + "' was released to one of these platforms, which one?",
			correct : randomGame,
			similar : similarPlatforms,
			view : blank,
			format : gamePlatform,
			weight : 10
		},
		platform_year : {
			title : (correct) => "In which year was the system '" + correct.name + "' released?",
			correct : randomPlatform,
			similar : similarPlatformYears,
			view : blank,
			format : platformYear,
			weight : 10
		},
		song : {
			title : (correct) => "From which games soundtrack is this song?",
			correct : randomGameWithSong,
			similar : similarGames,
			view : songVideo,
			format : gameTitle,
			weight : 25
		}
	}

	self.describe = function() {
		var countSelector = {
			fromArray : (arr) => { return arr.length; }
		};
		return {
			type : 'videogames',
			name : 'Video Games',
			icon : 'fa-gamepad',
			count : Object.keys(types).map((t) => types[t].correct(countSelector)).reduce((a, b) => { return a + b; }, 0)
		};
	}

	self.preload = function(progress, cache, apikeys) {
		youtubeApiKey = apikeys.youtube;
		igdbApiKey = apikeys.igdb;

		return new Promise((resolve, reject) => {
			loadPlatforms(cache).then((result) => {
				platforms = result;
				var loadPlatforms = Object.keys(platforms).filter((p) => platforms[p].games >= MINIMUM_PLATFORM_GAMES);
				var total = loadPlatforms.length * GAMES_PER_PLATFORM;

				progress(games.length, total);

				var promises = loadPlatforms.map((platform) => loadGames(platform, cache));

				for (var i = 0; i < (promises.length - 1); i++) {
					promises[i].then((data) => {
						games = games.concat(data);
						progress(games.length, total);
						return promises[i + 1];
					});
				}
				promises[promises.length - 1].then((data) => {
					games = games.concat(data);
					loadVideos(progress, cache).then((videos) => {
						parseTitles(videos).filter((t) => {
							games.forEach((g) => {
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
		return new Promise((resolve, reject) => {
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
		return cache.get('songs', (resolve, reject) => {
			youtube.loadChannel('UC6iBH7Pmiinoe902-JqQ7aQ', progress, youtubeApiKey).then(resolve).catch(reject);
		});
	}

	function loadGames(platform, cache) {
		return cache.get(platform, (resolve, reject) => {
			$http.get('/trivia/igdb-api.py/games/', {
				params : {
					fields : 'name,url,first_release_date,release_dates,screenshots,keywords,themes,genres',
					limit : GAMES_PER_PLATFORM,
					offset : 0,
					order : 'rating:desc',
					'filter[screenshots][exists]' : '',
					'filter[release_dates.platform][eq]' : platform
				},
				headers : {
					'user-key' : igdbApiKey
				}
			}).then((response) => {
				function tag(prefix, arr) {
					if (!arr) {
						return [];
					}

					return arr.map((i) => prefix + i);
				}

				var games = response.data.map((game) => {
					return {
						name : game.name,
						release_date : release_date(game.first_release_date),
						screenshots : game.screenshots.map((ss) => ss.cloudinary_id),
						platforms : game.release_dates.map((rd) => platforms[rd.platform] ? platforms[rd.platform].name : null).filter((p, i, arr) => p != null && arr.indexOf(p) == i),
						tags : [].concat(tag('k', game.keywords)).concat(tag('t', game.themes)).concat(tag('g', game.genres)),
						attribution : game.url
					};
				});
				resolve(games);
			});
		});
	}

	function loadPlatforms(cache) {
		function loadPage(offset) {
			return $http.get('/trivia/igdb-api.py/platforms/', {
				params : {
					fields : 'name,generation,games,versions.release_dates.date',
					limit : 50,
					offset : offset
				},
				headers : {
					'user-key' : igdbApiKey
				}
			})
		};

		return cache.get('platforms', (resolve, reject) => {
			result = [];
			function callback(response) {
				result = result.concat(response.data);

				if (response.data.length == 50) {
					loadPage(result.length).then(callback);
				} else {
					var object = {};
					result.forEach((platform) => {
						if (!platform.versions) {
							platform.versions = [];
						}
						var release_dates = platform.versions.map((v) => v.release_dates ? v.release_dates.map((d)  => d.date) : []).reduce((a, b) => [].concat(a).concat(b), []);

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
		return videos.map((v) => {
			var match = v.title.match(/Best VGM [0-9]+ - (.*?)( - ).*/);
			if (!match) {
				return null;
			}

			return {
				id : v.id,
				title : match[1]
			};
		}).filter((v) => v != null);
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
		return selector.fromArray(games.filter((g) => g.songs));
	}

	function randomPlatform(selector) {
		function hasDate(p) {
			return p.release_date != new Date(0).toISOString();
		};
		return selector.fromArray(Object.keys(platforms).map((p) => platforms[p]).filter(hasDate));
	}

	function similarGames(game, selector) {
		var titleWords = selector.wordsFromString(game.name);
		return games.map((g) => {
			return {
				game : g,
				score : selector.levenshteinDistance(titleWords, selector.wordsFromString(g.name)) + selector.levenshteinDistance(game.tags, g.tags) + selector.dateDistance(game.release_date, g.release_date)
			};
		}).sort((a, b) => a.score - b.score).map((node) => node.game);
	}

	function similarGameYears(game, selector) {
		return selector.yearAlternatives(gameYear(game), 3).map((year) => ({ release_date : year }));
	}

	function similarPlatformYears(platform, selector) {
		return selector.yearAlternatives(platformYear(platform), 3).map((year) => ({ release_date : year }));
	}

	function similarPlatforms(game, selector) {
		function dateDifference(a, b) {
			return selector.dateDistance(a.release_date, game.release_date) - selector.dateDistance(b.release_date, game.release_date);
		}

		var unused = Object.keys(platforms).map((p) => platforms[p]).filter((p) => game.platforms.indexOf(p) == -1).sort(dateDifference);

		return [
			{ platforms : [selector.splice(unused).name] },
			{ platforms : [selector.splice(unused).name] },
			{ platforms : [selector.splice(unused).name] }
		]
	}

	function screenshot(game, selector) {
		return {
			player : 'image',
			url : 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/' + selector.fromArray(game.screenshots) + '.jpg',
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
