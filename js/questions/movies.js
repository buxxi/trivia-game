triviaApp.service('movies', function($http, $interval, apikeys) {
	function MovieQuestions() {
		var self = this;
		var movies = [];

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

		self.nextQuestion = function(random) {
			return new Promise(function(resolve, reject) {
				var title = random.fromArray(Object.keys(movies));
				var videoId = random.fromArray(movies[title].videos);
				var attribution = ['http://www.youtube.com/watch?v=' + videoId];

				checkEmbedStatus(videoId, 'SE').then(function() { //TODO: country code from where?
					return loadSimilarMovies(title, movies[title].year, attribution);
				}).then(function(similar) {
					similar = fillArrayWithTitles(similar, random);
					resolve({
						text : "What is the title of this movie?",
						answers : [
							title,
							similar[0],
							similar[1],
							similar[2]
						],
						correct : title,
						view : {
							player : 'youtube',
							videoId : videoId,
							attribution : attribution
						}
					});
				}).catch(function(err) {
					console.log(videoId + ": " + err);
					self.nextQuestion(random).then(function(question) {
						resolve(question);
					});
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
								year : metadata.year,
								videos : []
							}
							movie = movies[metadata.title];
						}
						movie.videos.push(video.id);
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
						console.log("Loading Youtube videos: " + current + "/" + total);
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

		function checkEmbedStatus(videoId, countryCode) {
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
						if (regionRestriction.blocked && regionRestriction.blocked.indexOf(countryCode) != -1) {
							return reject("Video is not available in " + countryCode);
						}
						if (regionRestriction.allowed && regionRestriction.allowed.indexOf(countryCode) == -1) {
							return reject("Video is not available in " + countryCode);
						}
					}
					resolve();
				});
			});
		}

		function loadSimilarMovies(title, year, attribution) {
			return new Promise(function(resolve, reject) {
				$http.get('https://api.themoviedb.org/3/search/movie', {
					params : {
						api_key : apikeys.tmdb,
						query : title,
						year : year
					}
				}).then(function(response) {
					if (response.data.results.length == 0) {
						return new Promise(function(resolve, reject) {
							resolve({ data : { results : [] } });  //TODO reject instead?
						});
					}
					var id = response.data.results[0].id;

					return $http.get('https://api.themoviedb.org/3/movie/' + id + '/similar', {
						params : {
							api_key : apikeys.tmdb
						}
					}).then(function(response) {
						var titles = response.data.results.map(function(item) {
							return item.title;
						});

						attribution.push("http://www.themoviedb.org/movie/" + id);
						resolve(titles);
					});
				});
			});
		}

		function fillArrayWithTitles(answers, title, random) {
			answers = answers.filter(function(item, i, array) { return item != title && array.indexOf(item) == i });

			while (answers.length < 3) {
				var randomTitle = random.fromArray(Object.keys(movies));
				if (answers.indexOf(randomTitle) == -1) {
					answers.push(randomTitle);
				}
			}

			return answers.slice(0, 3);
		}
	}

	return new MovieQuestions();
});
