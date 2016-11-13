triviaApp.service('movies', function($http, $interval, apikeys) {
	function MovieQuestions() {
		var self = this;
		var movies = [];
		var YOUTUBE_REGION = 'SE';

		var types = {
			title : {
				title : function(correct) { return "What is the title of this movie?" },
				correct : randomMovie,
				similar : loadSimilarMovies,
				format : movieTitle,
			},
			year : {
				title : function(correct) { return "What year is this movie from?" },
				correct : randomMovie,
				similar : loadSimilarYears,
				format : movieYear,
			}
		};

		self.describe = function() {
			return {
				type : 'movies',
				name : 'Movies',
				icon : 'fa-film'
			};
		}

		self.preload = function(progress, cache) {
			return new Promise(function(resolve, reject) {
				loadYoutubeVideos(progress, cache).then(parseTitles).then(function(data) {
					movies = data;
					resolve();
				});
			});
		}

		self.nextQuestion = function(selector) {
			return new Promise(function(resolve, reject) {
				var type = types[selector.fromArray(Object.keys(types))];

				var movie = type.correct(selector);
				var videoId = selector.fromArray(movie.videos);
				var attribution = ['http://www.youtube.com/watch?v=' + videoId];

				checkEmbedStatus(videoId).then(function() {
					return type.similar(movie, attribution, selector);
				}).then(function(similar) {
					resolve({
						text : type.title(movie),
						answers : selector.alternatives(similar, movie, type.format, selector.first),
						correct : type.format(movie),
						view : {
							player : 'youtube',
							videoId : videoId,
							attribution : {
								title : "Clips from",
								name : movie.title + " (" + movie.year + ")",
								links : attribution
							}
						}
					});
				}).catch(function(err) {
					if (typeof(err) == 'string') {
						console.log(movie.title + " got handled error " + err + ", trying another one");
						return self.nextQuestion(selector).then(resolve, reject);
					} else {
						reject(err);
					}
				});
			});
		}

		function parseTitle(input) {
			var blackList = ["Trailer","Teaser","TV Spot","BROWSE","MASHUP","Most Popular","in GENRE","MovieClips Picks","DVD Extra", "Featurette"];
			for (var i = 0; i < blackList.length; i++) {
				if (input.indexOf(blackList[i]) != -1) {
					return null;
				}
			}
			var patterns = [
				/.*?- (.*) \(\d+\/\d+\) Movie CLIP \((\d+)\) HD/i,
				/(.*?) \(\d+\/\d+\) Movie CLIP - .* \((\d+)\) HD/i,
				/(.*?) #\d+ Movie CLIP - .* \((\d+)\) HD/i,
				/.*? - (.*) Movie \((\d+)\) - HD/i,
				/(.*?) Movie CLIP - .* \((\d+)\) HD/i,
				/(.*?) \(\d+\/\d+\).* -\s+\((\d+)\) HD/i,
				/.*? SCENE - (.*) \((\d+)\) HD/i,
				/(.*?) \(\d+\/\d+\) MovieCLIP[s]? - .* \((\d+)\)/i,
				/(.*?) \(\d+\/\d+\) Movie CLIP - .*\((\d+)\) HD/i,
				/(.*?) - .*\((\d+)\) HD/i
			];

			for (var i = 0; i < patterns.length; i++) {
				var match = patterns[i].exec(input);
				if (match) {
					return {
						title : match[1],
						year : match[2]
					};
				}
			}

			return null;
		}

		function parseTitles(result) {
			return new Promise(function(resolve, reject) {
				var movies = {};
				result.forEach(function(video) {
					var metadata = parseTitle(video.title);
					if (metadata) {
						var movie = movies[metadata.title];
						if (!movie) {
							movies[metadata.title] = {
								year : parseInt(metadata.year),
								videos : []
							}
							movie = movies[metadata.title];
						}
						movie.videos.push(video.id);
					}
				});

				movies = Object.keys(movies).map(function(title) {
					return {
						title : title,
						year : movies[title].year,
						videos : movies[title].videos
					}
				});

				resolve(movies);
			});
		}

		function loadYoutubeVideos(progress, cache) {
			return cache.get('videos', function(resolve, reject) {
				var result = [];

				function loadUploads() {
					$http.get('https://www.googleapis.com/youtube/v3/channels', {
						params : {
							id : 'UC3gNmTGu-TTbFPpfSs5kNkg',
							key : apikeys.youtube,
							part : 'contentDetails'
						}
					}).then(function(response) {
						loadPage(response.data.items[0].contentDetails.relatedPlaylists.uploads);
					});
				}

				function loadPage(playListId, pageToken) {
					$http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
						params : {
							key : apikeys.youtube,
							playlistId : playListId,
							part : 'id,snippet,contentDetails',
							maxResults : 50,
							pageToken : pageToken
						}
					}).
					then(function(response) {
						var current = result.length;
						var total = response.data.pageInfo.totalResults;
						progress(current, total);
						var nextPage = response.data.nextPageToken;

						result = result.concat(response.data.items.map(function(item) {
							return {
								id : item.contentDetails.videoId,
								title : item.snippet.title
							}
						}));
						if (nextPage) {
							loadPage(playListId, nextPage);
						} else {
							resolve(result);
						}
					});
				}

				loadUploads();
			});
		}

		function checkEmbedStatus(videoId) {
			return new Promise(function(resolve, reject) {
				$http.get('https://www.googleapis.com/youtube/v3/videos', {
					params : {
						key : apikeys.youtube,
						id : videoId,
						part : 'status,contentDetails'
					}
				}).then(function(response) {
					var item = response.data.items[0];
					if (!item.status.embeddable) {
						return reject("Video not embeddable");
					}
					var regionRestriction = item.contentDetails.regionRestriction;
					if (regionRestriction) {
						if (regionRestriction.blocked && regionRestriction.blocked.indexOf(YOUTUBE_REGION) != -1) {
							return reject("Video is not available in " + YOUTUBE_REGION);
						}
						if (regionRestriction.allowed && regionRestriction.allowed.indexOf(YOUTUBE_REGION) == -1) {
							return reject("Video is not available in " + YOUTUBE_REGION);
						}
					}
					resolve();
				});
			});
		}

		function loadSimilarMovies(movie, attribution, selector) {
			return new Promise(function(resolve, reject) {
				$http.get('https://api.themoviedb.org/3/search/movie', {
					params : {
						api_key : apikeys.tmdb,
						query : movie.title,
						year : movie.year
					}
				}).then(function(response) {
					if (response.data.results.length != 1) {
						return reject("Didn't find an exact match for the movie metadata");
					}
					var id = response.data.results[0].id;

					return $http.get('https://api.themoviedb.org/3/movie/' + id + '/similar', {
						params : {
							api_key : apikeys.tmdb
						}
					}).then(function(response) {
						if (response.data.results.length < 3) {
							return reject("Got less than 3 similar movies");
						}

						var similar = response.data.results.map(function(item) {
							return {
								title : item.title,
								year : new Date(item.release_date).getFullYear()
							};
						});

						attribution.push("http://www.themoviedb.org/movie/" + id);
						return resolve(similar);
					});
				});
			});
		}

		function loadSimilarYears(movie, attribute, selector) {
			return new Promise(function(resolve, reject) {
				resolve(selector.yearAlternatives(movie.year, 3).map(function(year) { return { year : year }; }));
			});
		}

		function randomMovie(selector) {
			return selector.fromArray(movies);
		}

		function movieTitle(movie) {
			return movie.title;
		}

		function movieYear(movie) {
			return movie.year;
		}
	}

	return new MovieQuestions();
});
