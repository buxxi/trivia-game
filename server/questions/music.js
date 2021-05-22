const TRACKS_BY_CATEGORY = 100;

class MusicQuestions {
	constructor() {
		this._tracks = [];
		this._spotifyWhiteListGenres = [];
		this._spotifyApiKey = '';

		this._types = {
			title : {
				title : (correct) => "What is the name of this song?",
				correct : this._randomTrack,
				similar : this._similarTracks,
				format : this._trackTitle,
				view : this._mp3Track,
				weight : 40
			},
			artist : {
				title : (correct) => "Which artist is this?",
				correct : this._randomTrack,
				similar : this._similarTracks,
				format : this._artistName,
				view : this._mp3Track,
				weight : 30
			},
			album : {
				title : (correct) => "From which album is this song?",
				correct : this._randomTrack,
				similar : this._similarTracks,
				format : this._albumName,
				view : this._mp3Track,
				weight : 10
			},
			artistImage : {
				title : (correct) => "Name the artist in the image",
				correct : this._randomTrack,
				similar : this._similarTracks,
				format : this._artistName,
				view : this._artistImage,
				weight : 20
			}
		};
	}

	describe() {
		return {
			type : 'music',
			name : 'Music',
			icon : 'fa-music',
			attribution : [
				{ url: 'https://spotify.com', name: 'Spotify' }
			],
			count : tracks.length * Object.keys(types).length
		};
	}

	preload(progress, cache, apikeys, game) {
		this._spotifyApiKey = apikeys.spotify;
		this._spotifyWhiteListGenres = apikeys.spotifyWhiteList;

		return new Promise(async (resolve, reject) => {
			if (this._tracks.length != 0) {
				resolve();
				return;
			}
			
			try {
				let accessToken = await this._loadSpotifyAccessToken();
				let categories = await this._loadSpotifyCategories(accessToken, cache);
				
				progress(0, categories.length);
				var loaded = 0;

				for (let category of categories) {
					let categoryData = await loadCategory(accessToken, category, cache);
					loaded++;
					this._tracks = this._tracks.concat(categoryData);
					progress(loaded, categories.length);
				}

				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	nextQuestion(selector) {
		return new Promise((resolve, reject) => {
			var type = selector.fromWeightedObject(this._types);
			var track = type.correct(selector);

			resolve({
				text : type.title(track),
				answers : selector.alternatives(type.similar(track, selector), track, type.format, selector.splice),
				correct : type.format(track),
				view : type.view(track)
			});
		});
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

	_loadCategoryChunk(accessToken, category, popularity) {
		return new Promise((resolve, reject) => {
			fetch(`https://api.spotify.com/v1/recommendations?seed_genres=${category}&min_popularity=${popularity}&max_popularity=${popularity + 9}&limit=${TRACKS_BY_CATEGORY}`, {
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			}).
			then(this._toJSON).
			then((data) => {
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
				resolve(result);
			}).catch(this._retryAfterHandler(() => this._loadCategoryChunk(accessToken, category, popularity), resolve, reject));	
		});
	}

	_loadSpotifyCategories(accessToken, cache) {
		return cache.get('categories', (resolve, reject) => {
			fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			}).
			then(this._toJSON).
			then(data => {
				var genres = data.genres;
				if (spotifyWhiteListGenres) {
					genres = genres.filter((g) => spotifyWhiteListGenres.indexOf(g) > -1);
				} else {
					spotifyWhiteListGenres = genres;
				}
				resolve(genres);
			}).catch(this._retryAfterHandler(() => this._loadSpotifyCategories(accessToken, cache), resolve, reject));
		});
	}

	_loadSpotifyAccessToken() {
		return new Promise((resolve, reject) => {
			var path = window.location.href.substr(0, window.location.href.lastIndexOf('/trivia'));
			var redirect_uri = path + '/trivia/spotifyauth.html';
			var url = 'https://accounts.spotify.com/authorize?client_id=' + spotifyApiKey + '&response_type=token&redirect_uri=' + encodeURIComponent(redirect_uri);

			function accessTokenListener(event) {
				//TODO: verify origin
				var accessToken = /access_token=([^&]+)/.exec(event.data);
				clearInterval(closeListener);
				popup.close();
				window.removeEventListener('message', accessTokenListener, false);
				if (accessToken) {
					resolve(accessToken[1]);
				} else {
					reject();
				}
			}

			window.addEventListener('message', accessTokenListener, false);

			var popup = window.open(url, 'spotify', 'width=600,height=600');
			
			var closeListener = setInterval(() => {
				if (popup.closed) {
					reject("Popup was closed");
					clearInterval(closeListener);
				}
			}, 100);
		});
	}

	_loadArtists(artistIds, category, accessToken) {
		return new Promise(async (resolve, reject) => {
			var artists = [];

			try {
				while (artistIds.length > 0) {
					var chunkResult = await this._loadArtistsChunk(accessToken, category, artistIds.splice(0, 50));
					artists = artists.concat(chunkResult);
				}
			} catch (e) {
				reject(e);
			}

			resolve(artists.reduce((map, obj) => {
				map[obj.id] = obj;
				return map;
			}, {}));
		})
	}

	_loadArtistsChunk(accessToken, category, chunkedIds) {
		return new Promise((resolve, reject) => {
			fetch(`https://api.spotify.com/v1/artists?ids=${chunkedIds.join(',')}`, {
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			}).
			then(this._toJSON).
			then(data => {
				var artists = data.artists.filter(artist => {
					var genres = artist.genres.map(genre => genre.toLowerCase().replace(' ', '-'));
					return genres.indexOf(category) > -1;
				});
				resolve(artists);
			}).catch(this._retryAfterHandler(() => this._loadArtistsChunk(accessToken, category, chunkedIds), resolve, reject));
		});
	}

	_retryAfterHandler(promise, resolve, reject) {
		return (err) => {
			if (err.status == 429) {
				let time = (parseInt(err.headers.get('retry-after')) + 1) * 1000;
				setTimeout(() => {
					promise().then(resolve).catch(reject);
				}, time);
				return;
			}
			reject();
		};
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

	_randomTrack(selector) {
		var categoryWeight = {};
		tracks.forEach((track) => {
			if (!categoryWeight[track.category]) {
				categoryWeight[track.category] = { name : track.category, weight : track.popularity };
			} else {
				categoryWeight[track.category].weight += track.popularity;
			}
		});

		var category = selector.fromWeightedObject(categoryWeight).name;

		return selector.fromArray(tracks, (track) => track.category == category);
	}

	_similarTracks(track, selector) {
		var allowedCategories = [track.category];
		var differentGenreCount = Math.floor((10 - track.popularity) / 2);
		for (var i = 0; i < differentGenreCount; i++) {
			allowedCategories.push(selector.fromArray(spotifyWhiteListGenres)); //This could possibly add the same category many times
		}
		
		return tracks.filter(function(s) {
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

module.exports = MusicQuestions;