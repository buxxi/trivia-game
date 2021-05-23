const fetch = require("node-fetch");
const YoutubeLoader = require('../youtubeloader');

class MovieQuestions {
	constructor(youtubeApiKey, tmdbApiKey) {
		this._movies = [];
		this._tmdbApiKey = tmdbApiKey;
		this._youtube = new YoutubeLoader('UC3gNmTGu-TTbFPpfSs5kNkg', youtubeApiKey);

		this._types = {
			title : {
				title : (correct) => "What is the title of this movie?",
				correct : (selector, attribution) => this._randomMovieClip(selector, attribution),
				similar : (correct, attribution, selector) => this._loadSimilarMovies(correct, attribution, selector),
				format : (correct) => this._movieTitle(correct),
				view : (correct, attribution) => this._viewMovieClip(correct, attribution),
				count : () => this._countUniqueClips(),
				weight : 75
			},
			year : {
				title : (correct) => "What year is this movie from?",
				correct : (selector, attribution) => this._randomMovieClip(selector, attribution),
				similar : (correct, attribution, selector) => this._loadSimilarYears(correct, attribution, selector),
				format : (correct) => this._movieYear(correct),
				view : (correct, attribution) => this._viewMovieClip(correct, attribution),
				count : () => this._countUniqueClips(),
				weight : 25
			}
		};
	}

	describe() {
		return {
			type : 'movies',
			name : 'Movies',
			icon : 'fa-film',
			attribution : [
				{ url: 'https://youtube.com', name: 'YouTube' },
				{ url: 'https://www.themoviedb.org', name: 'TheMovieDB' }
			],
			count : Object.keys(this._types).map((t) => this._types[t].count()).reduce((a, b) => a + b, 0)
		};
	}

	preload(progress, cache, apikeys, game) {
		return new Promise(async (resolve, reject) => {
			try {
				let videos = await this._loadYoutubeVideos(progress, cache);
				this._movies = this._parseTitles(videos);
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	nextQuestion(selector) {
		return new Promise(async (resolve, reject) => {
			var type = selector.fromWeightedObject(this._types);
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
					return this.nextQuestion(selector).then(resolve).catch(reject);
				} else {
					reject(err);
				}
			};
		});
	}

	_parseTitle(input) {
		var blackList = ["Trailer","Teaser","TV Spot","BROWSE","MASHUP","Most Popular","in GENRE","MovieClips Picks","DVD Extra", "Featurette"];
		for (var i = 0; i < blackList.length; i++) {
			if (input.indexOf(blackList[i]) != -1) {
				return null;
			}
		}
		var patterns = [
			/(.*) \((\d+)\) - .* | Movieclips/i,
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

	_parseTitles(result) {
		var movies = {};
		result.forEach((video) => {
			let metadata = this._parseTitle(video.title);

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

	_loadYoutubeVideos(progress, cache) {
		return cache.get('videos', (resolve, reject) => {
			this._youtube.loadChannel(progress).then(resolve).catch(reject);
		});
	}

	_loadSimilarMovies(movie, attribution, selector) {
		return new Promise(async (resolve, reject) => {
			try {
				let movieResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${this._tmdbApiKey}&query=${movie.title}&year=${movie.year}`);
				let movieData = await this._toJSON(movieResponse);
				if (movieData.results.length != 1) {
					return reject("Didn't find an exact match for the movie metadata");
				}
				let id = movieData.results[0].id;

				let similarResponse = await fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${this._tmdbApiKey}`);
				let similarData = await this._toJSON(similarResponse);
				if (similarData.results.length < 3) {
					return reject("Got less than 3 similar movies");
				}

				let similar = similarData.results.map((item) => {
					return {
						title : item.title,
						year : new Date(item.release_date).getFullYear()
					};
				});

				attribution.push("http://www.themoviedb.org/movie/" + id);
				resolve(similar);
			} catch (e) {
				reject(e);
			}
		});
	}

	_loadSimilarYears(movie, attribute, selector) {
		return new Promise((resolve, reject) => {
			resolve(selector.yearAlternatives(movie.year, 5).map((year) => { return { year : year }; }));
		});
	}

	_randomMovieClip(selector, attribution) {
		return new Promise((resolve, reject) => {
			let movie = selector.fromArray(this._movies);
			let videoId = selector.fromArray(movie.videos);
			this._youtube.checkEmbedStatus(videoId).then(() => {
				attribution.push('http://www.youtube.com/watch?v=' + videoId);
				let copy = Object.assign({}, movie); //Copy the movie object so we don't modify the original and replace the array of videos with a single video
				copy.videos = [videoId];
				resolve(copy);
			}).catch((err) => {
				console.log(movie.title + " can't be embedded " + err + ", trying another one");
				reject(err);
			});
		});
	}

	_movieTitle(movie) {
		return movie.title;
	}

	_movieYear(movie) {
		return movie.year;
	}

	_viewMovieClip(correct, attribution) {
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

	_countUniqueClips() {
		return this._movies.map((m) => m.videos.length).reduce((a, b) => a + b, 0);
	}

	_toJSON(response) { //TODO: copy pasted
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}
}

module.exports = MovieQuestions;