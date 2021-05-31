import fetch from 'node-fetch';
import YoutubeLoader from '../youtubeloader.mjs';

const GAMES_PER_PLATFORM = 50;

class VideoGameQuestions {
	constructor(youtubeApiKey, igdbClientId, igdbClientSecret) {
		this._games = [];
		this._platforms = [];

		this._igdbClientId = igdbClientId;
		this._igdbClientSecret = igdbClientSecret;
		this._igdbBaseURL = 'https://api.igdb.com/v4/';
		this._youtube = new YoutubeLoader('UCzRj15rxSdLAbANoZsbyWjg', youtubeApiKey);

		this._types = {
			screenshot : {
				title : (correct) => "What game is this a screenshot of?",
				correct : (selector) => this._randomGame(selector),
				similar : (correct, selector) => this._similarGames(correct, selector),
				view : (correct, selector) => this._screenshot(correct, selector),
				format : (correct) => this._gameTitle(correct),
				weight : 45
			},
			year : {
				title : (correct) => "In which year was '" + correct.name + "' first released?",
				correct : (selector) => this._randomGame(selector),
				similar : (correct, selector) => this._similarGameYears(correct, selector),
				view : (correct, selector) => this._blank(correct, selector),
				format : (correct) => this._gameYear(correct),
				weight : 10
			},
			platform : {
				title : (correct) => "'" + correct.name + "' was released to one of these platforms, which one?",
				correct : (selector) => this._randomGame(selector),
				similar : (correct, selector) => this._similarPlatforms(correct, selector),
				view : (correct, selector) => this._blank(correct, selector),
				format : (correct) => this._gamePlatform(correct),
				weight : 10
			},
			song : {
				title : (correct) => "From which games soundtrack is this song?",
				correct : (selector) => this._randomGameWithSong(selector),
				similar : (correct, selector) => this._similarGames(correct, selector),
				view : (correct, selector) => this._songVideo(correct, selector),
				format : (correct) => this._gameTitle(correct),
				weight : 25
			}
		}
	}

	describe() {
		return {
			type : 'videogames',
			name : 'Video Games',
			icon : 'fa-gamepad',
			attribution : [
				{ url: 'https://youtube.com', name: 'YouTube' },
				{ url: 'https://www.igdb.com', name: 'IGDB' }
			]
		};
	}

	async preload(progress, cache, game) {
		let token = await this._loadTwitchAccessToken();
		this._platforms = await this._loadPlatforms(cache, token);
		
		let toLoadPlatforms = Object.keys(this._platforms);
		let total = toLoadPlatforms.length * GAMES_PER_PLATFORM;

		progress(this._games.length, total);

		for (let platform of toLoadPlatforms) {
			let gamesChunk = await this._loadGames(platform, this._platforms, cache, token);
			this._games = this._games.concat(gamesChunk);
			progress(this._games.length, total);
		}

		let videos = await this._loadVideos(progress, cache);
		this._matchVideosToGames(videos, this._games);

		return this._countQuestions();
	}

	async nextQuestion(selector) {
		let type = selector.fromWeightedObject(this._types);
		let correct = type.correct(selector);
		let similar = type.similar(correct, selector);

		return ({
			text : type.title(correct),
			answers : selector.alternatives(similar, correct, type.format, (arr) => selector.first(arr)),
			correct : type.format(correct),
			view : type.view(correct, selector)
		});
	}

	_countQuestions() {
		let countSelector = {
			fromArray : (arr) => { return arr.length; }
		};
		return Object.keys(this._types).map((t) => this._types[t].correct(countSelector)).reduce((a, b) => { return a + b; }, 0);
	}

	async _loadTwitchAccessToken() {
		let url = `https://id.twitch.tv/oauth2/token?client_id=${this._igdbClientId}&client_secret=${this._igdbClientSecret}&grant_type=client_credentials`;
		let response = await fetch(url, {
			method: 'POST'
		});
		let data = await this._toJSON(response);
		return data.access_token;
	}

	_loadVideos(progress, cache) {
		return cache.get('songs', (resolve, reject) => {
			this._youtube.loadChannel(progress).then(resolve).catch(reject);
		});
	}

	_loadGames(platform, platforms, cache, token) {
		return cache.get(platform, async (resolve, reject) => {
			try {
				let inputData = `fields name,url,first_release_date,platforms,screenshots,keywords,themes,genres; where platforms = ${platform} & first_release_date != null & screenshots != null & rating_count > 2; limit ${GAMES_PER_PLATFORM}; offset 0; sort rating desc;`;
				let response = await fetch(this._igdbBaseURL + 'games/',{
					method : 'POST',
					headers : {
						'Client-ID' : this._igdbClientId,
						'Authorization': `Bearer ${token}`
					},
					body : inputData
				});
				let data = await this._toJSON(response);

				function tag(prefix, arr) {
					if (!arr) {
						return [];
					}

					return arr.map((i) => prefix + i);
				}

				let release_date = this._release_date;

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
				let result = await this._loadScreenshots(games, token);
				resolve(result);
			} catch(e) {
				reject(e);
			};
		});
	}

	async _loadScreenshots(games, token) {
		let screenshotIds = games.flatMap(g => g.screenshots);
		var result = {};
		while (screenshotIds.length > 0) {
			var chunkResult = await this._loadScreenshotChunk(screenshotIds.splice(0, 10), token);
			Object.assign(result, chunkResult);
		}
		for (var game of games) {
			game.screenshots = game.screenshots.map(id => result[id]).filter(id => !!id);
		}
		return games;
	}

	async _loadScreenshotChunk(ids, token) {
		let inputData = `fields id,image_id; where id = (${ids.join(',')}); limit 10;`;
		let response = await fetch(this._igdbBaseURL + 'screenshots/', {
			method : 'POST',
			headers : {
				'Client-ID' : this._igdbClientId,
				'Authorization': `Bearer ${token}`
			},
			body : inputData
		});
		let data = await this._toJSON(response);
		let result = {};
		for (var screenshot of data) {
			result[screenshot.id] = screenshot.image_id;
		}
		return result;
	}

	_loadPlatforms(cache, token) {
		return cache.get('platforms', async (resolve, reject) => {
			try {
				let result = {};
				let chunkResult;
				do {
					chunkResult = await this._loadPlatformChunk(Object.keys(result).length, token);
					result = Object.assign(result, chunkResult);
				} while (false && Object.keys(chunkResult).length == 50);
				resolve(result);
			} catch(e) {
				reject(e);
			}
		});
	}

	async _loadPlatformChunk(offset, token) {
		let inputData = `fields id,name; where category = (1,5); limit 50; offset ${offset};`
		let response = await fetch(this._igdbBaseURL + 'platforms/', {
			method : 'POST',
			headers : {
				'Client-ID' : this._igdbClientId,
				'Authorization': `Bearer ${token}`
			},
			body : inputData
		});
		let data = await this._toJSON(response);
		let result = {};
		data.forEach((platform) => {
			result[platform.id] = {
				name : platform.name
			}
		});
		return result;
	};

	_matchVideosToGames(videos, games) {
		let gamesByName = {};
		for (let game of games) {
			gamesByName[this._toAlphaNumeric(game.name)] = game;
		}
		this._parseTitles(videos).forEach((t) => {
			let game = gamesByName[t.title];
			if (game) {
				game.songs = game.songs || [];
				game.songs.push(t.id);
			}
		});
	}

	_parseTitles(videos) {
		let patterns = [
			/VGM [0-9]+ - (.*?)( - ).*/i,
			/(.*) OST[\s]*-? .*/i,
		];

		return videos.map((v) => {
			for (let pattern of patterns) {
				let match = v.title.match(pattern);
				if (match) {
					return {
						id : v.id,
						title : this._toAlphaNumeric(match[1])
					};
				}
			}

			return null;
		}).filter((v) => v != null);
	}

	_toAlphaNumeric(str) {
		let x = /[^a-z0-9]/g;
		return str.toLowerCase().replace(x, '');
	}

	_randomGame(selector) {
		return selector.fromArray(this._games);
	}

	_randomGameWithSong(selector) {
		return selector.fromArray(this._games.filter((g) => g.songs));
	}

	_similarGames(game, selector) {
		var titleWords = selector.wordsFromString(game.name);
		return this._games.map((g) => {
			return {
				game : g,
				score : selector.levenshteinDistance(titleWords, selector.wordsFromString(g.name)) + selector.levenshteinDistance(game.tags, g.tags) + selector.dateDistance(game.release_date, g.release_date)
			};
		}).sort((a, b) => a.score - b.score).map((node) => node.game);
	}

	_similarGameYears(game, selector) {
		return selector.yearAlternatives(this._gameYear(game), 3).map((year) => ({ release_date : year }));
	}

	_similarPlatforms(game, selector) {
		function dateDifference(a, b) {
			return selector.dateDistance(a.release_date, game.release_date) - selector.dateDistance(b.release_date, game.release_date);
		}

		var unused = Object.keys(this._platforms).map((p) => this._platforms[p]).filter((p) => game.platforms.indexOf(p) == -1).sort(dateDifference);

		return [
			{ platforms : [selector.splice(unused).name] },
			{ platforms : [selector.splice(unused).name] },
			{ platforms : [selector.splice(unused).name] }
		]
	}

	_screenshot(game, selector) {
		return {
			player : 'image',
			url : 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/' + selector.fromArray(game.screenshots) + '.jpg',
			attribution : {
				title : "Screenshot of",
				name : this._gameTitle(game) + " (" + this._gameYear(game) + ")",
				links : [game.attribution]
			}
		}
	}

	_songVideo(game, selector) {
		let videoId = selector.fromArray(game.songs);

		return {
			player : 'youtubeaudio',
			videoId : videoId,
			attribution : {
				title : "Music from",
				name : this._gameTitle(game) + " (" + this._gameYear(game) + ")",
				links : [game.attribution, 'http://www.youtube.com/watch?v=' + videoId]
			}
		}
	}

	_blank(game, selector) {
		return {
			attribution : {
				title : "Featured game",
				name : this._gameTitle(game) + " (" + this._gameYear(game) + ")",
				links : [game.attribution]
			}
		}
	}

	_gameTitle(game) {
		return game.name;
	}

	_gameYear(game) {
		return new Date("" + game.release_date).getFullYear();
	}

	_gamePlatform(game) {
		return game.platforms[0];
	}

	_release_date(time) {
		return new Date(time * 1000).toISOString();
	}

	_toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}
}

export default VideoGameQuestions;