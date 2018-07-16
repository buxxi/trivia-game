function MusicQuestions($http) {
	var self = this;
	var tracks = [];
	var TRACKS_BY_CATEGORY = 100;
	
	var spotifyWhiteListGenres = [];
	var spotifyApiKey = '';

	var types = {
		title : {
			title : (correct) => "What is the name of this song?",
			correct : randomTrack,
			similar : similarTracks,
			format : trackTitle,
			view : mp3Track,
			weight : 40
		},
		artist : {
			title : (correct) => "Which artist is this?",
			correct : randomTrack,
			similar : similarTracks,
			format : artistName,
			view : mp3Track,
			weight : 30
		},
		album : {
			title : (correct) => "From which album is this song?",
			correct : randomTrack,
			similar : similarTracks,
			format : albumName,
			view : mp3Track,
			weight : 10
		},
		artistImage : {
			title : (correct) => "Name the artist in the image",
			correct : randomTrack,
			similar : similarTracks,
			format : artistName,
			view : artistImage,
			weight : 20
		}
	};

	self.describe = function() {
		return {
			type : 'music',
			name : 'Music',
			icon : 'fa-music',
			count : tracks.length * Object.keys(types).length
		};
	}

	self.preload = function(progress, cache, apikeys) {
		spotifyApiKey = apikeys.spotify;
		spotifyWhiteListGenres = apikeys.spotifyWhiteList;

		return new Promise((resolve, reject) => {
			if (tracks.length != 0) {
				resolve();
				return;
			}
			loadSpotifyAccessToken().then((accessToken) => {
				loadSpotifyCategories(accessToken, cache).then((categories) => {
					progress(0, categories.length);

					var loaded = 0;
					var callback = (data) => {
						loaded++;
						tracks = tracks.concat(data);
						progress(loaded, categories.length);
						if (loaded == categories.length) {
							resolve();
						} else {
							loadCategory(accessToken, categories[loaded], cache).then(callback).catch(reject);
						}
					};

					loadCategory(accessToken, categories[0], cache).then(callback).catch(reject);

				}).catch(reject);
			}).catch(reject);
		});
	}

	self.nextQuestion = function(selector) {
		return new Promise((resolve, reject) => {
			var type = selector.fromWeightedObject(types);
			var track = type.correct(selector);

			resolve({
				text : type.title(track),
				answers : selector.alternatives(type.similar(track, selector), track, type.format, selector.splice),
				correct : type.format(track),
				view : type.view(track)
			});
		});
	}

	function parseTitle(title) {
		var junked = /(.*?) (\(|-|\[)[^\(\-\[]*(Remaster|Studio|Best of|acoustic|Re-recorded|feat.|Radio Edit|Radio Mix|Club Mix|Original Mix|Original Version).*/i.exec(title);
		if (junked) {
			title = junked[1];
		}

		return title;
	}

	function loadCategory(accessToken, category, cache) {
		return cache.get(category, (resolve, reject) => {
			var tracks = [];
			var popularity = 0;

			var callback = (chunkResult) => {
				tracks = tracks.concat(chunkResult);
				popularity += 10;
				if (popularity < 100) {
					loadCategoryChunk(accessToken, category, popularity).then(callback).catch(reject);	
				} else {
					loadArtists(uniqueArtistIds(tracks), category, accessToken).then((artists) => {
						tracks = mergeTracksAndArtists(tracks, artists);
						resolve(tracks);
					}).catch(reject);
				}
			}
			loadCategoryChunk(accessToken, category, popularity).then(callback).catch(reject);	
		});
	}

	function loadCategoryChunk(accessToken, category, popularity) {
		return new Promise((resolve, reject) => {
			$http.get('https://api.spotify.com/v1/recommendations', {
				params : {
					seed_genres : category,
					min_popularity : popularity,
					max_popularity : popularity + 9,
					limit : TRACKS_BY_CATEGORY
				},
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			}).then((response) => {
				var result = response.data.tracks.filter((track) => !!track.preview_url).map((track) => {
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
			}).catch(retryAfterHandler(() => loadCategoryChunk(accessToken, category, popularity), resolve, reject));	
		});
	}

	function loadSpotifyCategories(accessToken, cache) {
		return cache.get('categories', (resolve, reject) => {
			$http.get('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			}).then((response) => {
				var genres = response.data.genres;
				if (spotifyWhiteListGenres) {
					genres = genres.filter((g) => spotifyWhiteListGenres.indexOf(g) > -1);
				} else {
					spotifyWhiteListGenres = genres;
				}
				resolve(genres);
			}).catch(retryAfterHandler(() => loadSpotifyCategories(accessToken, cache), resolve, reject));
		});
	}

	function loadSpotifyAccessToken() {
		return new Promise((resolve, reject) => {
			var path = window.location.href.substr(0, window.location.href.lastIndexOf('/trivia'));
			var redirect_uri = path + '/trivia/spotifyauth.html';
			var url = 'https://accounts.spotify.com/authorize?client_id=' + spotifyApiKey + '&response_type=token&redirect_uri=' + encodeURIComponent(redirect_uri);

			function accessTokenListener(event) {
				//TODO: verify origin
				var accessToken = /access_token=([^&]+)/.exec(event.data);
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
		});
	}

	function loadArtists(artistIds, category, accessToken) {
		return new Promise((resolve, reject) => {
			var artists = [];

			var callback = (chunkResult) => {
				artists = artists.concat(chunkResult);
				if (artistIds.length > 0) {
					loadArtistsChunk(accessToken, category, artistIds.splice(0, 50)).then(callback).catch(reject);	
				} else {
					resolve(artists.reduce((map, obj) => {
						map[obj.id] = obj;
						return map;
					}, {}));
				}
			}
			loadArtistsChunk(accessToken, category, artistIds.splice(0, 50)).then(callback).catch(reject);	
		})
	}

	function loadArtistsChunk(accessToken, category, chunkedIds) {
		return new Promise((resolve, reject) => {
			$http.get('https://api.spotify.com/v1/artists', {
				params : {
					ids : chunkedIds.join(',')
				},
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			}).then((response) => {
				var artists = response.data.artists.filter(artist => {
					var genres = artist.genres.map(genre => genre.toLowerCase().replace(' ', '-'));
					console.log(genres);
					return genres.indexOf(category) > -1;
				});
				resolve(artists);
			}).catch(retryAfterHandler(() => loadArtistsChunk(accessToken, category, chunkedIds), resolve, reject));
		});
	}

	function retryAfterHandler(promise, resolve, reject) {
		return (err) => {
			if (err.status == 429) {
				var time = (parseInt(err.headers()['retry-after']) + 1) * 1000;
				setTimeout(() => {
					promise().then(resolve).catch(reject);
				}, time);
				return;
			}
			reject();
		};
	}

	function mergeTracksAndArtists(tracks, artists) {
		return tracks.filter(track => !!artists[track.artist.id]).map(track => {
			var images = artists[track.artist.id].images;
			if (images.length > 0) {
				track.artist.image = images[0].url;
			}
			return track;
		});
	}

	function uniqueArtistIds(tracks) {
		var artistIds = tracks.map((track) => track.artist.id).filter((item, pos, arr) => {
			return arr.indexOf(item) == pos;
		});
		return artistIds;
	}

	function randomTrack(selector) {
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

	function similarTracks(track, selector) {
		var allowedCategories = [track.category];
		var differentGenreCount = Math.floor((10 - track.popularity) / 2);
		for (var i = 0; i < differentGenreCount; i++) {
			allowedCategories.push(selector.fromArray(spotifyWhiteListGenres)); //This could possibly add the same category many times
		}
		
		return tracks.filter(function(s) {
			return allowedCategories.indexOf(s.category) != -1;
		});
	}

	function trackTitle(track) {
		return track.title;
	}

	function artistName(track) {
		return track.artist.name;
	}

	function albumName(track) {
		return track.album;
	}

	function artistImage(track) {
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

	function mp3Track(track) {
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
