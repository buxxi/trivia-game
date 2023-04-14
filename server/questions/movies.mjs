import fetch from 'node-fetch';
import {YoutubeLoader, YoutubeError} from '../youtubeloader.mjs';

class MovieQuestions {
	constructor(config) {
		this._movies = [];
		this._tmdbApiKey = config.tmdb.clientId;
		this._youtube = new YoutubeLoader('UC3gNmTGu-TTbFPpfSs5kNkg', config.youtube.clientId, config.youtube.region);

		this._types = {
			title : {
				title : (correct) => "Which movie is this from?",
				correct : (selector, attribution) => this._randomMovieClip(selector, attribution),
				similar : (correct, attribution, selector) => this._loadSimilarMovies(correct, attribution, selector),
				format : (correct) => this._movieTitle(correct),
				view : (correct, attribution) => this._viewMovieClip(correct, attribution),
				count : () => this._countUniqueClips(),
				weight : 75
			},
			year : {
				title : (correct) => "Which year is this movie from?",
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
			name : 'Movies',
			icon : 'fa-film',
			attribution : [
				{ url: 'https://youtube.com', name: 'YouTube' },
				{ url: 'https://www.themoviedb.org', name: 'TheMovieDB' }
			]
		};
	}

	async preload(progress, cache) {
		let videos = await this._loadYoutubeVideos(progress, cache);
		this._movies = this._parseTitles(videos);
		return this._countQuestions();
	}

	async nextQuestion(selector) {
		var type = selector.fromWeightedObject(this._types);
		var attribution = [];

		try {
			var correct = await type.correct(selector, attribution);
			var similar = await type.similar(correct, attribution, selector);
			
			return ({
				text : type.title(correct),
				answers : selector.alternatives(similar, correct, type.format, selector.first),
				correct : type.format(correct),
				view : type.view(correct, attribution)
			});
		} catch(err) {
			if (err instanceof YoutubeError) {
				return this.nextQuestion(selector);
			} else {
				throw err;
			}
		};
	}

	_countQuestions() {
		return Object.keys(this._types).map((t) => this._types[t].count()).reduce((a, b) => a + b, 0);
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

	async _loadSimilarMovies(movie, attribution, selector) {
		try {
			let movieResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${this._tmdbApiKey}&query=${movie.title}&year=${movie.year}`);
			let movieData = await this._toJSON(movieResponse);
			if (movieData.results.length != 1) {
				throw "Didn't find an exact match for the movie metadata";
			}
			let id = movieData.results[0].id;

			let similarResponse = await fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${this._tmdbApiKey}`);
			let similarData = await this._toJSON(similarResponse);
			if (similarData.results.length < 3) {
				throw "Got less than 3 similar movies";
			}

			let similar = similarData.results.map((item) => {
				return {
					title : item.title,
					year : new Date(item.release_date).getFullYear()
				};
			});

			attribution.push("http://www.themoviedb.org/movie/" + id);
			return similar;
		} catch (e) {
			throw e;
		}
	}

	async _loadSimilarYears(movie, attribute, selector) {
		return selector.yearAlternatives(movie.year).map((year) => { return { year : year }; });
	}

	async _randomMovieClip(selector, attribution) {
		let movie = selector.fromArray(this._movies);
		let videoId = selector.fromArray(movie.videos);
		try {
			await this._youtube.checkEmbedStatus(videoId);
			attribution.push('http://www.youtube.com/watch?v=' + videoId);
			let copy = Object.assign({}, movie); //Copy the movie object so we don't modify the original and replace the array of videos with a single video
			copy.videos = [videoId];
			return copy;
		} catch (err) {
			console.log(movie.title + " can't be embedded " + err + ", trying another one");
			throw err;
		}
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

export default MovieQuestions;