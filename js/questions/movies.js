function MovieQuestions($http, $interval, youtube) {
	var self = this;
	var movies = [];
	var youtubeApiKey = '';
	var tmdbApiKey = '';

	var types = {
		title : {
			title : (correct) => "What is the title of this movie?",
			correct : randomMovie,
			similar : loadSimilarMovies,
			format : movieTitle,
			weight : 80
		},
		year : {
			title : (correct) => "What year is this movie from?",
			correct : randomMovie,
			similar : loadSimilarYears,
			format : movieYear,
			weight : 20
		}
	};

	self.describe = function() {
		return {
			type : 'movies',
			name : 'Movies',
			icon : 'fa-film'
		};
	}

	self.preload = function(progress, cache, apikeys) {
		youtubeApiKey = apikeys.youtube;
		tmdbApiKey = apikeys.tmdb;
		return new Promise((resolve, reject) => {
			loadYoutubeVideos(progress, cache).then(parseTitles).then((data) => {
				movies = data;
				resolve();
			});
		});
	}

	self.nextQuestion = function(selector) {
		return new Promise((resolve, reject) => {
			var type = selector.fromWeightedObject(types);

			var movie = type.correct(selector);
			var videoId = selector.fromArray(movie.videos);
			var attribution = ['http://www.youtube.com/watch?v=' + videoId];

			youtube.checkEmbedStatus(videoId, youtubeApiKey).then(() => type.similar(movie, attribution, selector)).then((similar) => {
				resolve({
					text : type.title(movie),
					answers : selector.alternatives(similar, movie, type.format, selector.first),
					correct : type.format(movie),
					view : {
						player : 'youtube',
						videoId : videoId,
						attribution : {
							title : "Clip from",
							name : movie.title + " (" + movie.year + ")",
							links : attribution
						}
					}
				});
			}).catch((err) => {
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
		return new Promise((resolve, reject) => {
			var movies = {};
			result.forEach((video) => {
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

			movies = Object.keys(movies).map((title) => {
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
		return cache.get('videos', (resolve, reject) => {
			youtube.loadChannel('UC3gNmTGu-TTbFPpfSs5kNkg', progress, youtubeApiKey).then(resolve).catch(reject);
		});
	}

	function loadSimilarMovies(movie, attribution, selector) {
		return new Promise((resolve, reject) => {
			$http.get('https://api.themoviedb.org/3/search/movie', {
				params : {
					api_key : tmdbApiKey,
					query : movie.title,
					year : movie.year
				}
			}).then((response) => {
				if (response.data.results.length != 1) {
					return reject("Didn't find an exact match for the movie metadata");
				}
				var id = response.data.results[0].id;

				return $http.get('https://api.themoviedb.org/3/movie/' + id + '/similar', {
					params : {
						api_key : tmdbApiKey
					}
				}).then((response) => {
					if (response.data.results.length < 3) {
						return reject("Got less than 3 similar movies");
					}

					var similar = response.data.results.map((item) => {
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
		return new Promise((resolve, reject) => {
			resolve(selector.yearAlternatives(movie.year, 3).map((year) => { return { year : year }; }));
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
