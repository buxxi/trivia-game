import YoutubeLoader from './youtubeloader.js';

export default function MovieQuestions() {
	var self = this;
	var movies = [];
	var youtubeApiKey = '';
	var tmdbApiKey = '';
	var youtube = new YoutubeLoader();

	var types = {
		title : {
			title : (correct) => "What is the title of this movie?",
			correct : randomMovieClip,
			similar : loadSimilarMovies,
			format : movieTitle,
			view : viewMovieClip,
			count : countUniqueClips,
			weight : 75
		},
		year : {
			title : (correct) => "What year is this movie from?",
			correct : randomMovieClip,
			similar : loadSimilarYears,
			format : movieYear,
			view : viewMovieClip,
			count : countUniqueClips,
			weight : 25
		}
	};

	self.describe = function() {
		return {
			type : 'movies',
			name : 'Movies',
			icon : 'fa-film',
			attribution : [
				{ url: 'https://youtube.com', name: 'YouTube' },
				{ url: 'https://www.themoviedb.org', name: 'TheMovieDB' }
			],
			count : Object.keys(types).map((t) => types[t].count()).reduce((a, b) => a + b, 0)
		};
	}

	self.preload = function(progress, cache, apikeys, game) {
		youtubeApiKey = apikeys.youtube;
		tmdbApiKey = apikeys.tmdb;

		return new Promise(async (resolve, reject) => {
			try {
				var videos = await loadYoutubeVideos(progress, cache);
				movies = parseTitles(videos);
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	self.nextQuestion = function(selector) {
		return new Promise(async (resolve, reject) => {
			var type = selector.fromWeightedObject(types);
			var attribution = [];

			try {
				var correct = await type.correct(selector, attribution);
				var similar = await type.similar(correct, attribution, selector);
				
				resolve({
					text : type.title(correct),
					answers : selector.alternatives(similar, correct, type.format, selector.first),
					correct : type.format(correct),
					view : type.view(correct, attribution)
				});
			} catch(err) {
				if (typeof(err) == 'string') {
					return self.nextQuestion(selector).then(resolve).catch(reject);
				} else {
					reject(err);
				}
			};
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

		return movies;
	}

	function loadYoutubeVideos(progress, cache) {
		return cache.get('videos', (resolve, reject) => {
			youtube.loadChannel('UC3gNmTGu-TTbFPpfSs5kNkg', progress, youtubeApiKey).then(resolve).catch(reject);
		});
	}

	function loadSimilarMovies(movie, attribution, selector) {
		return new Promise((resolve, reject) => {
			fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${movie.title}&year=${movie.year}`).
			then(toJSON).
			then(data => {
				if (data.results.length != 1) {
					return reject("Didn't find an exact match for the movie metadata");
				}
				var id = data.results[0].id;

				return fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${tmdbApiKey}`).
				then(toJSON).
				then(data => {
					if (data.results.length < 3) {
						return reject("Got less than 3 similar movies");
					}

					var similar = data.results.map((item) => {
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

	function countUniqueClips() {
		return movies.map((m) => m.videos.length).reduce((a, b) => a + b, 0);
	}

	function toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}
}
