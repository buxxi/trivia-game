import fetch from 'node-fetch';

const ACTOR_COUNT = 500;

class ActorQuestions {
	constructor(tmdbApiKey) {
		this._actors = [];
		this._tmdbApiKey = tmdbApiKey;
    
		this._types = {
			image : {
				title : (correct) => "Who is this " + (correct.male ? "actor" : "actress") + "?",
				correct : (selector) => this._randomActor(selector),
				similar : (correct) => this._similarActors(correct),
				format : (correct) => this._actorName(correct),
				view : (correct) => this._viewActorImage(correct),
				count : () => this._countActors()
			},
			age : {
				title : (correct) => "Who is oldest of these " + (correct.male ? "actors" : "actresses") + "?",
				correct : (selector) => this._randomActor(selector),
				similar : (correct) => this._youngerActors(correct),
				format : (correct) => this._actorName(correct),
				view : (correct) => this._viewBlank(correct),
				count : () => this._countActors()
			},
			born : {
				title : (correct) => "Where was " + correct.name + " born?",
				correct : (selector) => this._randomActor(selector),
				similar : (correct) => this._similarActors(correct),
				format : (correct) => this._countryOrState(correct),
				view : (correct) => this._viewBlank(correct),
				count : () => this._countActors()
			}
		};
	}

    describe() {
		return {
			type : 'actors',
			name : 'Actors',
			icon : 'fa-user',
			attribution : [
				{ url: 'https://www.themoviedb.org', name: 'TheMovieDB' }
			]
		};
	}

	async preload(progress, cache, game) {
		progress(0, ACTOR_COUNT);
		this._actors = await this._loadActors(progress, cache);
		return this._countQuestions();
    }

	async nextQuestion(selector) {	
		let type = selector.fromWeightedObject(this._types);

		let actor = type.correct(selector);
		let similar = type.similar(actor);

		return ({
			text : type.title(actor),
			answers : selector.alternatives(similar, actor, type.format, (arr) => selector.splice(arr)),
			correct : type.format(actor),
			view : type.view(actor)
		});
	}

	_countQuestions() {
		return Object.keys(this._types).map((t) => this._types[t].count()).reduce((a, b) => a + b, 0);
	}

	_loadActors(progress, cache) {
		return cache.get('actors', async (resolve, reject) => {
			let result = [];
			let page = 1;

			try {
				while (result.length < ACTOR_COUNT) {
					let actorsChunk = await this._loadActorsChunk(page++);
					for (var actor of actorsChunk) {
						actor = await this._loadActorDetails(actor);
						result.push(actor);
						progress(result.length, ACTOR_COUNT);
					}
				}
			} catch (e) {
				reject(e);
			}
			resolve(result);
		});
	}

	_toJSON(response) {
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}

	async _loadActorsChunk(page) {
		try {
			let response = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${this._tmdbApiKey}&page=${page}`);
			let data = await this._toJSON(response);
			let result = data.results.filter((actor) => !actor.adult).map((actor) => {
				return {
					id : actor.id
				};
			});
			return result;
		} catch(e) {
			try {
				await this._retryAfterHandler(e);
				return await this._loadActorsChunk(page);
			} catch (ex) {
				reject(ex);
			}
		}
	}

	async _loadActorDetails(actor) {
		try {
			let response = await fetch(`https://api.themoviedb.org/3/person/${actor.id}?api_key=${this._tmdbApiKey}`);
			let data = await this._toJSON(response);
			Object.assign(actor, {
				name : data.name,
				photo : data.profile_path,
				birthday : data.birthday,
				place_of_birth : data.place_of_birth,
				male : data.gender == 2
			});

			return actor;
		} catch(e) {
			try {
				await this._retryAfterHandler(e);
				return await this._loadActorDetails(actor);
			} catch (ex) {
				reject(ex);
			}
		}
	};

	_retryAfterHandler(err) {
		if (err.status == 429) {
			let time = (parseInt(err.headers.get('retry-after')) + 1) * 1000;
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve();
				}, time);
			});
		}
		throw err;
	}

	_similarActors(actor) {
		function sameGender(a, b) {
			return a.male == b.male;
		}
		function aboutSameAge(a, b) {
			if (!a || !b) {
				return true;
			}
			return Math.abs(a - b) <= 5;
		}

		return this._actors.filter((a) => sameGender(a, actor) && aboutSameAge(this._birthYear(a), this._birthYear(actor)) && !!this._countryOrState(a));
	}

	_youngerActors(actor) {
		function sameGender(a, b) {
			return a.male == b.male;
		}
		function younger(a, b) {
			if (!a || !b) {
				return false;
			}

			return a > b;
		}

		return this._actors.filter((a) => sameGender(a, actor) && younger(this._birthYear(a), this._birthYear(actor)));	
	}

	_randomActor(selector) {
		return selector.fromArray(this._actors.filter(a => !!a.birthday));
	}

	_actorName(actor) {
		return actor.name;
	}

	_birthYear(actor) {
		if (!actor.birthday) {
			return undefined;
		}
		return new Date(Date.parse(actor.birthday)).getFullYear();
	}

	_countryOrState(actor) {
		if (!actor.place_of_birth) {
			return undefined;
		}
		let location = actor.place_of_birth.trim();
		location = location.replace(/ - /g, ', ').replace(/  /, ' ');
		location = location.split(", ");
		for (let i = 0; i < location.length; i++) {
			location[i] = location[i].trim();
		}

		if (location.length < 2) {
			return undefined;
		}

		let country = location[location.length - 1];
		let state = location[location.length - 2];

		if (["États-Unis", "Allemagne de l'Ouest"].indexOf(country) > -1) {
			return undefined; //Not english, do not want
		}

		if (["USA", "U.S.A", "U.S.", "U.S.A.", "United States"].indexOf(country) > -1) {
			return state + ", USA";
		}
		if (country == "UK" || country == "EU") {
			country = state;
		}

		return country;
	}

	_viewBlank(correct) {
		return {			
			attribution : {
				title : "Actor",
				name : correct.name,
				links : ["http://www.themoviedb.org/person/" + correct.id]
			}
		};
	}

	_viewActorImage(correct) {
		return {
			player : 'image',
			url : "https://image.tmdb.org/t/p/h632" + correct.photo,
			attribution : {
				title : "Image of",
				name : correct.name,
				links : ["http://www.themoviedb.org/person/" + correct.id]
			}
		};
	}

	_countActors() {
		return this._actors.length;
	}
}

export default ActorQuestions;