function MusicQuestions($http) {
	var self = this;
	var tracks = [];
	var TRACKS_BY_CATEGORY = 100;
	var FILTER_GENRES = ["alternative","alt-rock","bluegrass","blues","classical","country","dance","death-metal","drum-and-bass","dubstep","emo","folk","funk","grunge","hard-rock","hardcore","heavy-metal","hip-hop","house","indie","indie-pop","metal","pop","punk","punk-rock", "r-n-b","reggae","rock","rock-n-roll","rockabilly","ska","soul","techno","trance"];

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
			icon : 'fa-music'
		};
	}

	self.preload = function(progress, cache, apikeys) {
		spotifyApiKey = apikeys.spotify;

		return new Promise((resolve, reject) => {
			if (tracks.length != 0) {
				resolve();
				return;
			}
			loadSpotifyAccessToken().then((accessToken) => {
				loadSpotifyCategories(accessToken, cache).then((categories) => {
					progress(tracks.length, categories.length * TRACKS_BY_CATEGORY);

					var promises = categories.map((category) => loadCategory(accessToken, category, cache));

					for (var i = 0; i < (promises.length - 1); i++) {
						promises[i].then((data) => {
							tracks = tracks.concat(data);
							progress(tracks.length, categories.length * TRACKS_BY_CATEGORY);
							return promises[i + 1];
						});
					}
					promises[promises.length - 1].then((data) => {
						tracks = tracks.concat(data);
						resolve();
					});
				});
			}).catch((err) => {
				reject();
			});
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
		var original = title;

		var junked = /(.*?) (\(|-|\[)[^\(\-\[]*(Remaster|Studio|Best of|acoustic|Re-recorded|feat.|Radio Edit|Radio Mix|Club Mix|Original Mix|Original Version).*/i.exec(title);
		if (junked) {
			title = junked[1];
		}

		return title;
	}

	function loadCategory(accessToken, category, cache) {
		return cache.get(category, (resolve, reject) => {
			$http.get('https://api.spotify.com/v1/recommendations', {
				params : {
					seed_genres : category,
					max_popularity : 75,
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
						category : category
					};
				});
				return result;
			}).then((result) => loadArtistImages(result, accessToken)).then(resolve).catch((err) => {
				if (err.status == 429) {
					var time = parseInt((err.headers()['retry-after']) + 1) * 1000;
					setTimeout(() => {
						loadCategory(accessToken, category).then(resolve).catch(reject);
					}, time);
					return;
				}
				reject();
			});
		});
	}

	function loadSpotifyCategories(accessToken, cache) {
		return cache.get('categories', (resolve, reject) => {
			$http.get('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
				headers : {
					Authorization : 'Bearer ' + accessToken
				}
			}).then((response) => {
				var genres = response.data.genres.filter((g) => FILTER_GENRES.indexOf(g) > -1);
				resolve(genres);
			});
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

	function loadArtistImages(result, accessToken) {
		return new Promise((resolve, reject) => {
			var artistIds = result.map((track) => track.artist.id).filter((item, pos, arr) => {
				return arr.indexOf(item) == pos;
			});

			var done = resolve;
			var promises = [];
			while (artistIds.length > 0) {
				var chunkedIds = artistIds.splice(0, 50);
				var i = promises.length;
				promises.push(new Promise((resolveLocal, rejectLocal) => {
					$http.get('https://api.spotify.com/v1/artists', {
						params : {
							ids : chunkedIds.join(',')
						},
						headers : {
							Authorization : 'Bearer ' + accessToken
						}
					}).then((response) => {
						var artists = response.data.artists;
						for (var i = 0; i < artists.length; i++) {
							for (var j = 0; j < result.length; j++) {
								if (artists[i].id == result[j].artist.id) {
									delete result[j].artist.id;
									var images = artists[i].images;
									if (images.length > 0) {
										result[j].artist.image = images[0].url;
									}
								}
							}
						}
						resolveLocal();
					});
				}));
			}

			//TODO: reuse code below
			for (var i = 0; i < (promises.length - 1); i++) {
				promises[i].then(() => {
					return promises[i + 1];
				})
			}

			promises[promises.length - 1].then(() => {
				resolve(result);
			});
		})
	}

	function randomTrack(selector) {
		return selector.fromArray(tracks);
	}

	function similarTracks(track, selector) {
		var allowedCategories = [track.category];
		while (true) {
			var category = selector.fromArray(tracks).category;
			if (allowedCategories.indexOf(category) == -1) {
				allowedCategories.push(category);
				break;
			}
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
