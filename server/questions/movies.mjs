import fetch from 'node-fetch';
import {YoutubeLoader, YoutubeError} from '../youtubeloader.mjs';
import Questions from './questions.mjs';
import Generators from '../generators.mjs';
import Random from '../random.mjs';

class MovieQuestions extends Questions {
	constructor(config, categoryName) {
		super(config, categoryName);
		this._movies = [];
		this._tmdbApiKey = config.tmdb.clientId;
		this._youtube = new YoutubeLoader('UC3gNmTGu-TTbFPpfSs5kNkg', config.youtube.clientId, config.youtube.region);

		this._addQuestion({
			title : (correct, translator) => translator.translate("question.title"),
			correct : () => this._randomMovieClip(),
			similar : (correct) => this._loadSimilarMovies(correct),
			format : (answer) => this._movieTitle(answer),
			load : (correct, translator) => this._loadMovieClip(correct, translator),
			count : () => this._countUniqueClips(),
			weight : 75
		});
		this._addQuestion({
			title : (correct, translator) => translator.translate("question.year"),
			correct : () => this._randomMovieClip(),
			similar : (correct) => this._loadSimilarYears(correct),
			format : (answer) => this._movieYear(answer),
			load : (correct, translator) => this._loadMovieClip(correct, translator),
			count : () => this._countUniqueClips(),
			weight : 25
		});
	}

	describe(language) {
		return {
			name : this._translator.to(language).translate('title'),
			icon : 'fa-film',
			attribution : [
				{ url: 'https://youtube.com', name: 'YouTube' },
				{ url: 'https://www.themoviedb.org', name: 'TheMovieDB' }
			]
		};
	}

	async preload(language, progress, cache) {
		let videos = await this._loadYoutubeVideos(progress, cache);
		this._movies = this._parseTitles(videos);
		return this._countQuestions();
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
			/(.*) \((\d{4})\) .* \| Movieclips/i,
			/.*?- (.*) \(\d+\/\d+\) Movie CLIP \((\d{4})\) HD/i,
			/(.*?) \(\d+\/\d+\) Movie CLIP - .* \((\d{4})\) HD/i,
			/(.*?) #\d+ Movie CLIP - .* \((\d{4})\) HD/i,
			/.*? - (.*) Movie \((\d{4})\) - HD/i,
			/(.*?) Movie CLIP - .* \((\d{4})\) HD/i,
			/(.*?) \(\d+\/\d+\).* -\s+\((\d{4})\) HD/i,
			/.*? SCENE - (.*) \((\d{4})\) HD/i,
			/(.*?) \(\d+\/\d+\) MovieCLIP[s]? - .* \((\d{4})\)/i,
			/(.*?) \(\d+\/\d+\) Movie CLIP - .*\((\d{4})\) HD/i,
			/(.*?) - .*\((\d{4})\) HD/i
		];

		for (var i = 0; i < patterns.length; i++) {
			var match = patterns[i].exec(input);
			if (match) {
				return {
					title : match[1].trim(),
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

	async _getMovieId(movie) {
		try {
			let movieResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${this._tmdbApiKey}&query=${movie.title}&year=${movie.year}`);
			let movieData = await this._toJSON(movieResponse);

			if (movieData.results.length == 1) {
				return movieData.results[0].id;
			}

			for (var i in movieData.results) {
				if (movieData.results[i].title == movie.title) {
					return movieData.results[i].id;
				}
			}

			throw new TmdbError("Didn't find an exact match for the movie metadata");
		} catch (e) {
			throw e;
		}
	}

	async _loadSimilarMovies(movie) {
		try {
			let similarResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}/similar?api_key=${this._tmdbApiKey}`);
			let similarData = await this._toJSON(similarResponse);
			if (similarData.results.length < 3) {
				throw new TmdbError("Got less than 3 similar movies");
			}

			let similar = similarData.results.map((item) => {
				return {
					title : item.title,
					year : new Date(item.release_date).getFullYear()
				};
			});

			return Generators.inOrder(similar);
		} catch (e) {
			throw e;
		}
	}

	async _loadSimilarYears(movie) {
		return Generators.years(movie.year, (year) => { return { year : year }; });
	}

	async _randomMovieClip() {
		let movie = Random.fromArray(this._movies);
		let videoId = Random.fromArray(movie.videos);
		try {
			await this._youtube.checkEmbedStatus(videoId);
			let tmdbId = await this._getMovieId(movie);
			//Copy the movie object so we don't modify the original and replace the array of videos with a single video
			let copy = Object.assign({tmdbId : tmdbId, video: videoId}, movie); 
			return copy;
		} catch(err) {
			if (err instanceof YoutubeError) {
				console.log(movie.title + " can't be embedded " + err + ", trying another one");
				return await this._randomMovieClip();
			} else if (err instanceof TmdbError) {
				console.log(movie.title + " can't be matched " + err + ", trying another one");
				return await this._randomMovieClip();
			} else {
				throw err;
			}
		};
	}

	_movieTitle(movie) {
		return movie.title;
	}

	_movieYear(movie) {
		return movie.year;
	}

	_loadMovieClip(correct, translator) {
		return {
			player : 'video',
			url : `https://www.youtube.com/watch?v=${correct.video}`,
			attribution : {
				title : translator.translate("attribution.clip"),
				name : correct.title + " (" + correct.year + ")",
				links : ["http://www.themoviedb.org/movie/" + correct.tmdbId, "http://www.youtube.com/watch?v=" + correct.video]
			}
		};
	}

	_countUniqueClips() {
		return this._movies.map((m) => m.videos.length).reduce((a, b) => a + b, 0);
	}
}

class TmdbError extends Error {
	constructor(message) {
		super(message);
	}
}

export default MovieQuestions;