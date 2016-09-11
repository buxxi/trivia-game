triviaApp.service('music', function($http, apikeys) {
	function MusicQuestions() {
		var self = this;
		var tracks = [];
		var TRACKS_BY_CATEGORY = 50;

		self.describe = function() {
			return {
				type : 'music',
				name : 'Music',
				icon : 'fa-music'
			};
		}

		self.preload = function(progress) {
			return new Promise(function(resolve, reject) {
				if (tracks.length != 0) {
					resolve();
					return;
				}
				loadSpotifyAccessToken().then(function(accessToken) {
					loadSpotifyCategories(accessToken).then(function(categories) {
						progress(tracks.length, categories.length * TRACKS_BY_CATEGORY);

						var promises = categories.map(function(category) {
							return loadCategory(accessToken, category);
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
				});
			});
		}

		self.nextQuestion = function(random) {
			return new Promise(function(resolve, reject) {
				var song = random.fromArray(tracks);
				var similar = tracks.filter(function(s) {
					return s.category == song.category && s.title != song.title;
				});

				resolve({
					text : "What is the name of this song? (" + song.category + ")",
					answers : [
						song.title,
						similar[0].title,
						similar[1].title,
						similar[2].title
					],
					correct : song.title,
					view : {
						player : 'mp3',
						mp3 : song.audio,
						attribution : [song.attribution]
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

		function loadCategory(accessToken, category) {
			return new Promise(function(resolve, reject) {
				var result = localStorage.getItem('spotify-' + category);
				if (result) {
					resolve(JSON.parse(result));
					return;
				}

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
					localStorage.setItem('spotify-' + category, JSON.stringify(result));
					resolve(result);
				});
			});
		}

		function loadSpotifyCategories(accessToken) {
			return new Promise(function(resolve, reject) {
				$http.get('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
					headers : {
						Authorization : 'Bearer ' + accessToken
					}
				}).then(function(response) {
					resolve(['punk']); //response.data.genres);
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
					resolve(accessToken[1]);
				}

				window.addEventListener('message', accessTokenListener, false);

				var popup = window.open(url, 'spotify', 'width=600,height=600');
			});
		}
	}

	return new MusicQuestions();
});
