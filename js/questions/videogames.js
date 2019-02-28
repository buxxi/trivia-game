function VideoGameQuestions(youtube) {
	var self = this;
	var games = [];

	var youtubeApiKey = '';
	var igdbApiKey = '';
	var igdbBaseURL = '';

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
		let countSelector = {
			fromArray : (arr) => { return arr.length; }
		};
		return {
			type : 'videogames',
			name : 'Video Games',
			icon : 'fa-gamepad',
			attribution : [
				{ url: 'https://youtube.com', name: 'YouTube' },
				{ url: 'https://www.igdb.com', name: 'IGDB' }
			],
			count : Object.keys(types).map((t) => types[t].correct(countSelector)).reduce((a, b) => { return a + b; }, 0)
		};
	}

	self.preload = function(progress, cache, apikeys, game) {
		youtubeApiKey = apikeys.youtube;
		igdbApiKey = apikeys.igdb;
		igdbBaseURL = apikeys.igdbBaseURL;

		return new Promise(async (resolve, reject) => {
			try {
				let platforms = await loadPlatforms(cache);
				let toLoadPlatforms = Object.keys(platforms);
				let total = toLoadPlatforms.length * GAMES_PER_PLATFORM;

				progress(games.length, total);

				for (let platform of toLoadPlatforms) {
					let gamesChunk = await loadGames(platform, platforms, cache);
					games = games.concat(gamesChunk);
					progress(games.length, total);
				}

				let videos = await loadVideos(progress, cache);
				matchVideosToGames(videos, games);

				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	self.nextQuestion = function(selector) {
		return new Promise((resolve, reject) => {
			let type = selector.fromWeightedObject(types);
			let correct = type.correct(selector);
			let similar = type.similar(correct, selector);

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

	function loadGames(platform, platforms, cache) {
		return cache.get(platform, (resolve, reject) => {
			let data = `fields name,url,first_release_date,platforms,screenshots,keywords,themes,genres; where platforms = ${platform} & first_release_date != null & screenshots != null & rating_count > 2; limit ${GAMES_PER_PLATFORM}; offset 0; sort rating desc;`;
			fetch(igdbBaseURL + 'games/',{
				method : 'POST',
				headers : {
					'user-key' : igdbApiKey
				},
				body : data
			}).
			then(toJSON).
			then(data => {
				function tag(prefix, arr) {
					if (!arr) {
						return [];
					}

					return arr.map((i) => prefix + i);
				}

				let games = data.map((game) => {
					return {
						name : game.name,
						release_date : release_date(game.first_release_date),
						screenshots : game.screenshots.slice(0,3),
						platforms : game.platforms.map((p) => platforms[p] ? platforms[p].name : null).filter((p, i, arr) => p != null && arr.indexOf(p) == i),
						tags : [].concat(tag('k', game.keywords)).concat(tag('t', game.themes)).concat(tag('g', game.genres)),
						attribution : game.url
					};
				});
				loadScreenshots(games).then(resolve);
			}).catch(reject);
		});
	}

	function loadScreenshots(games) {
		return new Promise(async (resolve, reject) => {
			try {
				let screenshotIds = games.flatMap(g => g.screenshots);
				var result = {};
				while (screenshotIds.length > 0) {
					var chunkResult = await loadScreenshotChunk(screenshotIds.splice(0, 10));
					Object.assign(result, chunkResult);
				}
				for (var game of games) {
					game.screenshots = game.screenshots.map(id => result[id]).filter(id => !!id);
				}
				resolve(games);
			} catch (e) {
				reject(e);
			}
		});
	}

	function loadScreenshotChunk(ids) {
		return new Promise((resolve, reject) => {
			let data = `fields id,image_id; where id = (${ids.join(',')}); limit 10;`;
			fetch(igdbBaseURL + 'screenshots/', {
				method : 'POST',
				headers : {
					'user-key' : igdbApiKey
				},
				body : data
			}).
			then(toJSON).
			then(data => {
				let result = {};
				for (var screenshot of data) {
					result[screenshot.id] = screenshot.image_id;
				}
				resolve(result);
			}).catch(reject);
		});
	}

	function loadPlatforms(cache) {
		return cache.get('platforms', async (resolve, reject) => {
			try {
				let result = {};
				let chunkResult;
				do {
					chunkResult = await loadPlatformChunk(Object.keys(result).length);
					result = Object.assign(result, chunkResult);
				} while (Object.keys(chunkResult).length == 50);
				resolve(result);
			} catch(e) {
				reject(e);
			}
		});
	}

	function loadPlatformChunk(offset) {
		return new Promise((resolve, reject) => {
			let data = `fields id,name; where category = (1,5); limit 50; offset ${offset};`
			fetch(igdbBaseURL + 'platforms/', {
				method : 'POST',
				headers : {
					'user-key' : igdbApiKey
				},
				body : data
			}).
			then(toJSON).
			then((data) => {
				let result = {};
				data.forEach((platform) => {
					result[platform.id] = {
						name : platform.name
					}
				});
				resolve(result);
			}).catch(reject);
		});
	};

	function matchVideosToGames(videos, games) {
		let gamesByName = {};
		for (game of games) {
			gamesByName[toAlphaNumeric(game.name)] = game;
		}
		parseTitles(videos).forEach((t) => {
			let game = gamesByName[t.title];
			if (game) {
				game.songs = game.songs || [];
				game.songs.push(t.id);
			}
		});
	}

	function parseTitles(videos) {
		return videos.map((v) => {
			let match = v.title.match(/Best VGM [0-9]+ - (.*?)( - ).*/);
			if (!match) {
				return null;
			}

			return {
				id : v.id,
				title : toAlphaNumeric(match[1])
			};
		}).filter((v) => v != null);
	}

	function toAlphaNumeric(str) {
		let x = /[^a-z0-9]/g;
		return str.toLowerCase().replace(x, '');
	}

	function randomGame(selector) {
		return selector.fromArray(games);
	}

	function randomGameWithSong(selector) {
		return selector.fromArray(games.filter((g) => g.songs));
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
		let videoId = selector.fromArray(game.songs);

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

	function gamePlatform(game) {
		return game.platforms[0];
	}

	function release_date(time) {
		return new Date(time * 1000).toISOString();
	}

	function toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}
}
