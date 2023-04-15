import fetch from 'node-fetch';
import YoutubeLoader from '../youtubeloader.mjs';
import QuestionSelector from '../selector.mjs';

const GAMES_PER_PLATFORM = 100;
const PAGINATE_COUNT = 100;

class VideoGameQuestions {
	constructor(config) {
		this._games = [];
		this._platforms = [];

		this._igdbClientId = config.igdb.clientId;
		this._igdbClientSecret = config.igdb.clientSecret;
		this._igdbBaseURL = 'https://api.igdb.com/v4/';
		this._youtube = new YoutubeLoader('UCzRj15rxSdLAbANoZsbyWjg', config.youtube.clientId, config.youtube.region);

		this._types = {
			screenshot : {
				title : (correct) => "Which game is this a screenshot of?",
				correct : () => this._randomGame(),
				similar : (correct) => this._similarGames(correct),
				view : (correct) => this._screenshot(correct),
				format : (correct) => this._gameTitle(correct),
				weight : 45
			},
			year : {
				title : (correct) => "In which year was '" + correct.name + "' first released?",
				correct : () => this._randomGame(),
				similar : (correct) => this._similarGameYears(correct),
				view : (correct) => this._blank(correct),
				format : (correct) => this._gameYear(correct),
				weight : 10
			},
			platform : {
				title : (correct) => "'" + correct.name + "' was released to one of these platforms, which one?",
				correct : () => this._randomGame(),
				similar : (correct) => this._similarPlatforms(correct),
				view : (correct) => this._blank(correct),
				format : (correct) => this._gamePlatform(correct),
				weight : 10
			},
			song : {
				title : (correct) => "From which games soundtrack is this song?",
				correct : () => this._randomGameWithSong(),
				similar : (correct) => this._similarGames(correct),
				view : (correct) => this._songVideo(correct),
				format : (correct) => this._gameTitle(correct),
				weight : 25
			}
		}
	}

	describe() {
		return {
			name : 'Video Games',
			icon : 'fa-gamepad',
			attribution : [
				{ url: 'https://youtube.com', name: 'YouTube' },
				{ url: 'https://www.igdb.com', name: 'IGDB' }
			]
		};
	}

	async preload(progress, cache) {
		let token = await this._loadTwitchAccessToken();
		this._platforms = await this._loadPlatforms(cache, token);
		
		let toLoadPlatforms = Object.keys(this._platforms);
		let total = toLoadPlatforms.length * GAMES_PER_PLATFORM;

		var games = [];

		progress(games.length, total);

		for (let platform of toLoadPlatforms) {
			let gamesChunk = await this._loadGames(platform, this._platforms, cache, token);
			games = games.concat(gamesChunk);
			progress(games.length, total);
		}

		let videos = await this._loadVideos(progress, cache);
		this._games = this._matchVideosToGames(videos, games);
		
		return this._countQuestions();
	}

	async nextQuestion() {
		let type = QuestionSelector.fromWeightedObject(this._types);
		let correct = type.correct();
		let similar = type.similar(correct);

		return ({
			text : type.title(correct),
			answers : QuestionSelector.alternatives(similar, correct, type.format, QuestionSelector.first),
			correct : type.format(correct),
			view : type.view(correct)
		});
	}

	_countQuestions() {
		return Object.keys(this._types).length * this._games.length;
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
				let inputData = `fields name,url,first_release_date,platforms,screenshots,keywords,themes,genres; where platforms = (${platform}) & first_release_date != null & screenshots != null & rating_count > 2; limit ${GAMES_PER_PLATFORM}; offset 0; sort rating desc;`;
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
			var chunkResult = await this._loadScreenshotChunk(screenshotIds.splice(0, PAGINATE_COUNT), token);
			Object.assign(result, chunkResult);
		}
		for (var game of games) {
			game.screenshots = game.screenshots.map(id => result[id]).filter(id => !!id);
		}
		return games;
	}

	async _loadScreenshotChunk(ids, token) {
		let inputData = `fields id,image_id; where id = (${ids.join(',')}); limit ${PAGINATE_COUNT};`;
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
				} while (false && Object.keys(chunkResult).length == PAGINATE_COUNT);
				resolve(result);
			} catch(e) {
				reject(e);
			}
		});
	}

	async _loadPlatformChunk(offset, token) {
		let inputData = `fields id,name; where category = (1,5); limit ${PAGINATE_COUNT}; offset ${offset};`
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
		return games;
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

	_randomGame() {
		return QuestionSelector.fromArray(this._games);
	}

	_randomGameWithSong() {
		return QuestionSelector.fromArray(this._games, g => !!g.songs);
	}

	_similarGames(game) {
		var titleWords = QuestionSelector.wordsFromString(game.name);
		return this._games.map((g) => {
			return {
				game : g,
				score : QuestionSelector.levenshteinDistance(titleWords, QuestionSelector.wordsFromString(g.name)) + QuestionSelector.levenshteinDistance(game, g, e => e.tags) + QuestionSelector.dateDistance(game.release_date, g.release_date)
			};
		}).sort((a, b) => a.score - b.score).map((node) => node.game);
	}

	_similarGameYears(game) {
		return QuestionSelector.yearAlternatives(this._gameYear(game)).map((year) => ({ release_date : year }));
	}

	_similarPlatforms(game) {
		function dateDifference(a, b) {
			return QuestionSelector.dateDistance(a.release_date, game.release_date) - QuestionSelector.dateDistance(b.release_date, game.release_date);
		}

		var unused = Object.keys(this._platforms).map((p) => this._platforms[p]).filter((p) => game.platforms.indexOf(p) == -1).sort(dateDifference);

		return unused.map(platform => ({ 'platforms' : [platform.name] }));
	}

	_screenshot(game) {
		return {
			player : 'image',
			url : 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/' + QuestionSelector.fromArray(game.screenshots) + '.jpg',
			attribution : {
				title : "Screenshot of",
				name : this._gameTitle(game) + " (" + this._gameYear(game) + ")",
				links : [game.attribution]
			}
		}
	}

	_songVideo(game) {
		let videoId = QuestionSelector.fromArray(game.songs);

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

	_blank(game) {
		return {
			attribution : {
				title : "Game",
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