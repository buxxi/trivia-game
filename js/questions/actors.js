function ActorQuestions() {
    var self = this;
    var actors = [];
    var ACTOR_COUNT = 500;
    var tmdbApiKey = '';
    
    var types = {
		image : {
			title : (correct) => "Who is this " + (correct.male ? "actor" : "actress") + "?",
			correct : randomActor,
			similar : similarActors,
			format : actorName,
			view : viewActorImage,
			count : countActors
		},
		age : {
			title : (correct) => "Who is oldest of these " + (correct.male ? "actors" : "actresses") + "?",
			correct : randomActor,
			similar : youngerActors,
			format : actorName,
			view : viewBlank,
			count : countActors
		},
		born : {
			title : (correct) => "Where was " + correct.name + " born?",
			correct : randomActor,
			similar : similarActors,
			format : countryOrState,
			view : viewBlank,
			count : countActors
		}
    };

    self.describe = function() {
		return {
			type : 'actors',
			name : 'Actors',
			icon : 'fa-user',
			attribution : [
				{ url: 'https://www.themoviedb.org', name: 'TheMovieDB' }
			],
			count : Object.keys(types).map((t) => types[t].count()).reduce((a, b) => a + b, 0)
		};
	}

	self.preload = function(progress, cache, apikeys) {
        tmdbApiKey = apikeys.tmdb;
        return new Promise(async (resolve, reject) => {
			try {
				progress(0, ACTOR_COUNT);
				actors = await loadActors(progress, cache);
				resolve();
			} catch (e) {
				reject(e);
			}
        });
    }

	self.nextQuestion = function(selector) {
		return new Promise((resolve, reject) => {
			let type = selector.fromWeightedObject(types);

			let actor = type.correct(selector);
			let similar = type.similar(actor);

			resolve({
				text : type.title(actor),
				answers : selector.alternatives(similar, actor, type.format, selector.splice),
				correct : type.format(actor),
				view : type.view(actor)
			});
		});
	}

	function loadActors(progress, cache) {
		return cache.get('actors', async (resolve, reject) => {
			let result = [];
			let page = 1;

			try {
				while (result.length < ACTOR_COUNT) {
					let actorsChunk = await loadActorsChunk(page++);
					for (actor of actorsChunk) {
						actor = await loadActorDetails(actor);
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

	function toJSON(response) {
		if (!response.ok) {
			throw response;
		}
		return response.json();
	}

	function loadActorsChunk(page) {
		return new Promise((resolve, reject) => {
			fetch(`https://api.themoviedb.org/3/person/popular?api_key=${tmdbApiKey}&page=${page}`).
			then(toJSON).
			then((data) => {
				let result = data.results.filter((actor) => !actor.adult).map((actor) => {
					return {
						id : actor.id
					};
				});
				resolve(result);
			}).catch(retryAfterHandler(() => loadActorsChunk(page), resolve, reject));
		});
	}

	function loadActorDetails(actor) {
		return new Promise((resolve, reject) => {
			fetch(`https://api.themoviedb.org/3/person/${actor.id}?api_key=${tmdbApiKey}`).
			then(toJSON).
			then((data) => {
				Object.assign(actor, {
					name : data.name,
					photo : data.profile_path,
					birthday : new Date(Date.parse(data.birthday)),
					place_of_birth : data.place_of_birth,
					male : data.gender == 2
				});

				resolve(actor);
			}).catch(retryAfterHandler(() => loadActorDetails(actor), resolve, reject));
		});
	};

	function retryAfterHandler(promise, resolve, reject) {
		return (err) => {
			if (err.status == 429) {
				var time = (parseInt(err.headers.get('retry-after')) + 1) * 1000;
				setTimeout(() => {
					promise().then(resolve).catch(reject);
				}, time);
				return;
			}
			reject();
		};
	}

	function similarActors(actor) {
		function sameGender(a, b) {
			return a.male == b.male;
		}
		function aboutSameAge(a, b) {
			if (!a.birthday || !b.birthday) {
				return true;
			}
			return Math.abs(a.birthday.getFullYear() - b.birthday.getFullYear()) <= 5;
		}

		return actors.filter((a) => sameGender(a, actor) && aboutSameAge(a - actor) && !!countryOrState(a));
	}

	function youngerActors(actor) {
		function sameGender(a, b) {
			return a.male == b.male;
		}
		function younger(a, b) {
			if (!a.birthday || !b.birthday) {
				return false;
			}
			return a.birthday.getFullYear() > b.birthday.getFullYear();
		}

		return actors.filter((a) => sameGender(a, actor) && younger(a, actor));	
	}

	function randomActor(selector) {
		return selector.fromArray(actors);
	}

	function actorName(actor) {
		return actor.name;
	}

	function countryOrState(actor) {
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
			return state;
		}
		if (country == "UK" || country == "EU") {
			country = state;
		}

		return country;
	}

	function viewBlank(correct) {
		return {			
			attribution : {
				title : "Actor",
				name : correct.name,
				links : ["http://www.themoviedb.org/person/" + correct.id]
			}
		};
	}

	function viewActorImage(correct) {
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

	function countActors() {
		return actors.length;
	}
}