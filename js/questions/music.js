triviaApp.service('music', function($http, apikeys) {
	function MusicQuestions() {
		var self = this;
		var tracks = [];
		var TRACKS_BY_CATEGORY = 50;

		var types = {
			title : {
				title : function(correct) { return "What is the name of this song?" },
				correct : randomTrack,
				similar : similarTracks,
				format : trackTitle,
			},
			artist : {
				title : function(correct) { return "Which artist is this?" },
				correct : randomTrack,
				similar : similarTracks,
				format : artistName
			},
			album : {
				title : function(correct) { return "From which album is this song?" },
				correct : randomTrack,
				similar : similarTracks,
				format : albumName
			}
		};

		self.describe = function() {
			return {
				type : 'music',
				name : 'Music',
				icon : 'fa-music'
			};
		}

		self.preload = function(progress, cache) {
			return new Promise(function(resolve, reject) {
				if (tracks.length != 0) {
					resolve();
					return;
				}
				loadSpotifyAccessToken().then(function(accessToken) {
					loadSpotifyCategories(accessToken, cache).then(function(categories) {
						progress(tracks.length, categories.length * TRACKS_BY_CATEGORY);

						var promises = categories.map(function(category) {
							return loadCategory(accessToken, category, cache);
						});

						for (var i = 0; i < (promises.length - 1); i++) {
							promises[i].then(function(data) {
								tracks = tracks.concat(data);
								progress(tracks.length, categories.length * TRACKS_BY_CATEGORY);
								return promises[i + 1];
							});
						}
						promises[promises.length - 1].then(function(data) {
							tracks = tracks.concat(data);
							resolve();
						});
					});
				}).catch(function(err) {
					reject();
				});
			});
		}

		self.nextQuestion = function(selector) {
			return new Promise(function(resolve, reject) {
				var type = types[selector.fromArray(Object.keys(types))];
				var track = type.correct(selector);

				resolve({
					text : type.title(track),
					answers : selector.alternatives(type.similar(track, selector), track, type.format, selector.splice),
					correct : type.format(track),
					view : {
						player : 'mp3',
						category : track.category,
						mp3 : track.audio,
						attribution : [track.attribution]
					}
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
			return cache.get(category, function(resolve, reject) {
				$http.get('https://api.spotify.com/v1/recommendations', {
					params : {
						seed_genres : category,
						limit : TRACKS_BY_CATEGORY
					},
					headers : {
						Authorization : 'Bearer ' + accessToken
					}
				}).then(function(response) {
					var result = response.data.tracks.filter(function(track) {
						return !!track.preview_url;
					}).map(function(track) {
						return {
							title : parseTitle(track.name),
							artist : track.artists[0].name,
							album : track.album.name,
							attribution : track.external_urls.spotify,
							audio : track.preview_url,
							category : category
						};
					});
					resolve(result);
				}).catch(function(err) {
					if (err.status == 429) {
						var time = parseInt((err.headers()['retry-after']) + 1) * 1000;
						setTimeout(function() {
							loadCategory(accessToken, category).then(resolve).catch(reject);
						}, time);
						return;
					}
					reject();
				});
			});
		}

		function loadSpotifyCategories(accessToken, cache) {
			return cache.get('categories', function(resolve, reject) {
				$http.get('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
					headers : {
						Authorization : 'Bearer ' + accessToken
					}
				}).then(function(response) {
					resolve(response.data.genres);
				});
			});
		}

		function loadSpotifyAccessToken() {
			return new Promise(function(resolve, reject) {
				var path = window.location.href.substr(0, window.location.href.lastIndexOf('/trivia'));
				var redirect_uri = path + '/trivia/spotifyauth.html';
				var url = 'https://accounts.spotify.com/authorize?client_id=' + apikeys.spotify + '&response_type=token&redirect_uri=' + encodeURIComponent(redirect_uri);

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

		function randomTrack(selector) {
			return selector.fromArray(tracks);
		}

		function similarTracks(track, selector) {
			return tracks.filter(function(s) {
				return s.category == track.category;
			});
		}

		function trackTitle(track) {
			return track.title;
		}

		function artistName(track) {
			return track.artist;
		}

		function albumName(track) {
			return track.album;
		}
	}

	return new MusicQuestions();
});
