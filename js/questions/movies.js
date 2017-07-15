function MovieQuestions($http, $interval, youtube) {
	var self = this;
	var movies = [];
	var actors = [];
	var ACTOR_COUNT = 500;
	var youtubeApiKey = '';
	var tmdbApiKey = '';

	var types = {
		title : {
			title : (correct) => "What is the title of this movie?",
			correct : randomMovieClip,
			similar : loadSimilarMovies,
			format : movieTitle,
			view : viewMovieClip,
			weight : 60
		},
		year : {
			title : (correct) => "What year is this movie from?",
			correct : randomMovieClip,
			similar : loadSimilarYears,
			format : movieYear,
			view : viewMovieClip,
			weight : 10
		},
		actor_name : {
			title : (correct) => "Who is this " + (correct.male ? "actor" : "actress") + "?",
			correct : randomActor,
			similar : loadSimilarActors,
			format : actorName,
			view : viewActorImage,
			weight : 30
		}
	};

	self.describe = function() {
		return {
			type : 'movies',
			name : 'Movies',
			icon : 'fa-film',
			count : movies.map((m) => m.videos.length).reduce((a, b) => a + b, 0) * Object.keys(types).length
		};
	}

	self.preload = function(progress, cache, apikeys) {
		youtubeApiKey = apikeys.youtube;
		tmdbApiKey = apikeys.tmdb;
		return new Promise((resolve, reject) => {
			loadYoutubeVideos(progress, cache).then(parseTitles).then((data) => {
				movies = data;
				loadActors(progress, cache).then((data) => {
					actors = data;
					resolve();
				});
			});
		});
	}

	self.nextQuestion = function(selector) {
		return new Promise((resolve, reject) => {
			var type = selector.fromWeightedObject(types);
			var attribution = [];

			type.correct(selector, attribution).then((correct) => {
				type.similar(correct, attribution, selector).then((similar) => {
					resolve({
						text : type.title(correct),
						answers : selector.alternatives(similar, correct, type.format, selector.first),
						correct : type.format(correct),
						view : type.view(correct, attribution)
					});
				}).catch(reject);
			}).catch((err) => {
				if (typeof(err) == 'string') {
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

	function loadActors(progress, cache) {
		return cache.get('actors', (resolve, reject) => {
			var result = [];

			function loadActorDetails(index) {
				return new Promise((detailResolve, detailReject) => {
					var actor = result[index];
					$http.get('https://api.themoviedb.org/3/person/' + actor.id, {
						params : {
							api_key : tmdbApiKey
						}
					}).then((response) => {
						progress(index, ACTOR_COUNT);

						var obj = response.data;
						Object.assign(actor, {
							name : obj.name,
							photo : obj.profile_path,
							birthday : new Date(Date.parse(obj.birthday)),
							male : obj.gender == 2
						});

						index++;
						if (index == result.length) {
							detailResolve();
						} else {
							loadActorDetails(index).then(detailResolve);
						}
					}).catch(detailReject);
				});
			};

			function loadPage(page) {
				return new Promise((pageResolve, pageReject) => {
					$http.get('https://api.themoviedb.org/3/person/popular', {
						params : {
							api_key : tmdbApiKey,
							page : page
						}
					}).then((response) => {
						result = result.concat(response.data.results.filter((actor) => !actor.adult).map((actor) => {
							return {
								id : actor.id
							};
						}));
						if (result.length < ACTOR_COUNT) {
							loadPage(page++).then(pageResolve);
						} else {
							pageResolve();
						}
					}).catch(pageReject);
				});
			}

			loadPage(1).then(() => loadActorDetails(0)).then(() => { resolve(result) }).catch(reject);
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
			resolve(selector.yearAlternatives(movie.year, 5).map((year) => { return { year : year }; }));
		});
	}

	function loadSimilarActors(actor, attribution, selector) {
		return new Promise((resolve, reject) => {
			function sameGender(a, b) {
				return a.male == b.male;
			}
			function aboutSameAge(a, b) {
				if (!a.birthday || !b.birthday) {
					return true;
				}
				return Math.abs(a.birthday.getFullYear() - b.birthday.getFullYear()) <= 5;
			}

			resolve(actors.filter((a) => sameGender(a, actor) && aboutSameAge(a - actor)));
		});
	}

	function randomActor(selector, attribution) {
		return new Promise((resolve, reject) => {
			var actor = selector.fromArray(actors);
			attribution.push("http://www.themoviedb.org/person/" + actor.id);
			resolve(actor);
		});
	}

	function randomMovieClip(selector, attribution) {
		return new Promise((resolve, reject) => {
			var movie = selector.fromArray(movies);
			var videoId = selector.fromArray(movie.videos);
			youtube.checkEmbedStatus(videoId, youtubeApiKey).then(() => {
				attribution.push('http://www.youtube.com/watch?v=' + videoId);
				var copy = Object.assign({}, movie); //Copy the movie object so we don't modify the original and replace the array of videos with a single video
				copy.videos = [videoId];
				resolve(copy);
			}).catch((err) => {
				console.log(movie.title + " can't be embedded " + err + ", trying another one");
				reject(err);
			});
		});
	}

	function actorName(actor) {
		return actor.name;
	}

	function movieTitle(movie) {
		return movie.title;
	}

	function movieYear(movie) {
		return movie.year;
	}

	function viewMovieClip(correct, attribution) {
		return {
			player : 'youtube',
			videoId : correct.videos[0],
			attribution : {
				title : "Clip from",
				name : correct.title + " (" + correct.year + ")",
				links : attribution
			}
		};
	}

	function viewActorImage(correct, attribution) {
		return {
			player : 'image',
			url : "https://image.tmdb.org/t/p/h632" + correct.photo,
			attribution : {
				title : "Image of",
				name : correct.name,
				links : attribution
			}
		};
	}
}
