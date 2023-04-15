import fetch from 'node-fetch';
import QuestionSelector from '../selector.mjs';

const TRACKS_BY_CATEGORY = 100;

class MusicQuestions {
	constructor(config) {
		this._tracks = [];
		this._spotifyWhiteListGenres = config.spotify.whiteList;
		this._spotifyClientId = config.spotify.clientId;
		this._spotifyClientSecret = config.spotify.clientSecret;

		this._types = {
			title : {
				title : (correct) => "What is the name of this song?",
				correct : () => this._randomTrack(),
				similar : (correct) => this._similarTracks(correct),
				format : (correct) => this._trackTitle(correct),
				view : (correct) => this._mp3Track(correct),
				weight : 40
			},
			artist : {
				title : (correct) => "Which artist is this?",
				correct : () => this._randomTrack(),
				similar : (correct) => this._similarTracks(correct),
				format : (correct) => this._artistName(correct),
				view : (correct) => this._mp3Track(correct),
				weight : 30
			},
			album : {
				title : (correct) => "From which album is this song?",
				correct : () => this._randomTrack(),
				similar : (correct) => this._similarTracks(correct),
				format : (correct) => this._albumName(correct),
				view : (correct) => this._mp3Track(correct),
				weight : 10
			},
			artistImage : {
				title : (correct) => "Which artist is this?",
				correct : () => this._randomTrack(),
				similar : (correct) => this._similarTracks(correct),
				format : (correct) => this._artistName(correct),
				view : (correct) => this._artistImage(correct),
				weight : 20
			}
		};
	}

	describe() {
		return {
			name : 'Music',
			icon : 'fa-guitar',
			attribution : [
				{ url: 'https://spotify.com', name: 'Spotify' }
			]
		};
	}

	async preload(progress, cache) {	
		let accessToken = await this._loadSpotifyAccessToken();
		let categories = await this._loadSpotifyCategories(accessToken, cache);

		progress(0, categories.length);
		var loaded = 0;

		var tracks = [];

		for (let category of categories) {
			let categoryData = await this._loadCategory(accessToken, category, cache);
			loaded++;
			tracks = tracks.concat(categoryData);
			progress(loaded, categories.length);
		}

		this._tracks = tracks;

		return this._countQuestions();
	}

	async nextQuestion() {
		let type = QuestionSelector.fromWeightedObject(this._types);
		let track = type.correct();

		return ({
			text : type.title(track),
			answers : QuestionSelector.alternatives(type.similar(track), track, type.format, QuestionSelector.splice),
			correct : type.format(track),
			view : type.view(track)
		});
	}

	_countQuestions() {
		return this._tracks.length * Object.keys(this._types).length;
	}

	_parseTitle(title) {
		var junked = /(.*?) (\(|-|\[)[^\(\-\[]*(Remaster|Studio|Best of|acoustic|Re-recorded|feat.|Radio Edit|Radio Mix|Club Mix|Original Mix|Original Version).*/i.exec(title);
		if (junked) {
			title = junked[1];
		}

		return title;
	}

	_loadCategory(accessToken, category, cache) {
		return cache.get(category, async (resolve, reject) => {
			var tracks = [];
			var popularity = 0;

			try {
				for (var popularity = 0; popularity < 100; popularity += 10) {
					var chunkResult = await this._loadCategoryChunk(accessToken, category, popularity);
					tracks = tracks.concat(chunkResult);
				}

				var artists = await this._loadArtists(this._uniqueArtistIds(tracks), category, accessToken);
				tracks = this._mergeTracksAndArtists(tracks, artists);
				resolve(tracks);
			} catch (e) {
				reject(e);
			}
		});
	}

	_toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}

	async _loadCategoryChunk(accessToken, category, popularity) {
		try {
			let url = `https://api.spotify.com/v1/recommendations?seed_genres=${category}&min_popularity=${popularity}&max_popularity=${popularity + 9}&limit=${TRACKS_BY_CATEGORY}`;
			let response = await fetch(url, {
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			});
			let data = await this._toJSON(response);
			let parseTitle = this._parseTitle;

			var result = data.tracks.filter((track) => !!track.preview_url).map((track) => {
				return {
					title : parseTitle(track.name),
					artist : {
						id : track.artists[0].id,
						name : track.artists[0].name}
					,
					album : track.album.name,
					attribution : track.external_urls.spotify,
					audio : track.preview_url,
					popularity : (popularity / 10) + 1,
					category : category
				};
			});
			return result;
		} catch(e) {
			try {
				await this._retryAfterHandler(e);
				return await this._loadCategoryChunk(accessToken, category, popularity)
			} catch (ex) {
				reject(ex);
			}
		}
	}

	_loadSpotifyCategories(accessToken, cache) {
		return cache.get('categories', async (resolve, reject) => {
			try {
				let response = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
					headers : {
						Authorization : 'Bearer ' + accessToken
					}
				});
				let data = await this._toJSON(response);
				var genres = data.genres;
				if (this._spotifyWhiteListGenres) {
					genres = genres.filter((g) => this._spotifyWhiteListGenres.indexOf(g) > -1);
				} else {
					this._spotifyWhiteListGenres = genres;
				}
				resolve(genres);
			} catch(e) {
				try {
					await this._retryAfterHandler(e);
					this._loadSpotifyCategories(accessToken, cache).then(resolve).catch(reject);
				} catch (ex) {
					reject(ex);
				}			
			}
		});
	}

	async _loadSpotifyAccessToken() {
		let auth = Buffer.from(this._spotifyClientId + ":" + this._spotifyClientSecret).toString('base64');

		let url = "https://accounts.spotify.com/api/token";
		let response = await fetch(url, {
			method: 'POST',
			body: 'grant_type=client_credentials',
			headers : {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${auth}`
			}
		});
		let data = await this._toJSON(response);
		return data.access_token;
	}

	async _loadArtists(artistIds, category, accessToken) {
		var artists = [];

		while (artistIds.length > 0) {
			let chunkResult = await this._loadArtistsChunk(accessToken, category, artistIds.splice(0, 50));
			artists = artists.concat(chunkResult);
		}

		return (artists.reduce((map, obj) => {
			map[obj.id] = obj;
			return map;
		}, {}));
	}

	async _loadArtistsChunk(accessToken, category, chunkedIds) {
		try {
			let response = await fetch(`https://api.spotify.com/v1/artists?ids=${chunkedIds.join(',')}`, {
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			});
			let data = await this._toJSON(response);
			var artists = data.artists.filter(artist => {
				var genres = artist.genres.map(genre => genre.toLowerCase().replace(' ', '-'));
				return genres.indexOf(category) > -1;
			});
			return artists;
		} catch(e) {
			try {
				await this._retryAfterHandler(e);
				return await this._loadArtistsChunk(accessToken, category, chunkedIds);
			} catch (ex) {
				reject(ex);
			}			
		}
	}

	_retryAfterHandler(err) {
		if (err.status == 429) {
			let time = (parseInt(err.headers.get('retry-after')) + 1) * 1000;
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve();
				}, time);
			});
		}
		throw err;
	}

	_mergeTracksAndArtists(tracks, artists) {
		return tracks.filter(track => !!artists[track.artist.id]).map(track => {
			let images = artists[track.artist.id].images;
			if (images.length > 0) {
				track.artist.image = images[0].url;
			}
			return track;
		});
	}

	_uniqueArtistIds(tracks) {
		let artistIds = tracks.map((track) => track.artist.id).filter((item, pos, arr) => {
			return arr.indexOf(item) == pos;
		});
		return artistIds;
	}

	_randomTrack() {
		var categoryWeight = {};
		this._tracks.forEach((track) => {
			if (!categoryWeight[track.category]) {
				categoryWeight[track.category] = { name : track.category, weight : track.popularity };
			} else {
				categoryWeight[track.category].weight += track.popularity;
			}
		});

		var category = QuestionSelector.fromWeightedObject(categoryWeight).name;

		return QuestionSelector.fromArray(this._tracks, (track) => track.category == category);
	}

	_similarTracks(track) {
		var allowedCategories = [track.category];
		var differentGenreCount = Math.floor((10 - track.popularity) / 2);
		for (var i = 0; i < differentGenreCount; i++) {
			allowedCategories.push(QuestionSelector.fromArray(this._spotifyWhiteListGenres)); //This could possibly add the same category many times
		}
		
		return this._tracks.filter(function(s) {
			return allowedCategories.indexOf(s.category) != -1;
		});
	}

	_trackTitle(track) {
		return track.title;
	}

	_artistName(track) {
		return track.artist.name;
	}

	_albumName(track) {
		return track.album;
	}

	_artistImage(track) {
		return {
			player : 'image',
			url : track.artist.image,
			attribution : {
				title : "Image of",
				name : track.artist.name,
				links : [track.attribution]
			}
		}
	}

	_mp3Track(track) {
		return {
			player : 'mp3',
			category : track.category,
			mp3 : track.audio,
			attribution : {
				title : "Music by",
				name : track.artist.name + " - " + track.title,
				links : [track.attribution]
			}
		}
	}
}

export default MusicQuestions;