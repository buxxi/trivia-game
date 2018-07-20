function ActorQuestions($http) {
    var self = this;
    var actors = [];
    var ACTOR_COUNT = 500;
    var tmdbApiKey = '';
    
    var types = {
		actor_name : {
			title : (correct) => "Who is this " + (correct.male ? "actor" : "actress") + "?",
			correct : randomActor,
			similar : similarActors,
			format : actorName,
			view : viewActorImage,
			count : countActors,
			weight : 30
        }
    };

    self.describe = function() {
		return {
			type : 'actors',
			name : 'Actors',
			icon : 'fa-user',
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
			let attribution = [];

			let actor = type.correct(selector, attribution);
			let similar = type.similar(actor, attribution, selector);

			resolve({
				text : type.title(actor),
				answers : selector.alternatives(similar, actor, type.format, selector.first),
				correct : type.format(actor),
				view : type.view(actor, attribution)
			});
		});
	}

	function loadActors(progress, cache) {
		return cache.get('actors', async (resolve, reject) => {
			let result = [];
			let page = 1;

			try {
				while (result.length < ACTOR_COUNT) {
					let actorsChunk = await loadActorsChunk(page);
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

	function loadActorsChunk(page) {
		return new Promise((resolve, reject) => {
			$http.get('https://api.themoviedb.org/3/person/popular', {
				params : {
					api_key : tmdbApiKey,
					page : page
				}
			}).then((response) => {
				let result = response.data.results.filter((actor) => !actor.adult).map((actor) => {
					return {
						id : actor.id
					};
				});
				resolve(result);
			}).catch(reject);
		});
	}

	function loadActorDetails(actor) {
		return new Promise((resolve, reject) => {
			$http.get('https://api.themoviedb.org/3/person/' + actor.id, {
				params : {
					api_key : tmdbApiKey
				}
			}).then((response) => {
				let obj = response.data;
				Object.assign(actor, {
					name : obj.name,
					photo : obj.profile_path,
					birthday : new Date(Date.parse(obj.birthday)),
					male : obj.gender == 2
				});

				resolve(actor);
			}).catch((err) => {
				if (err.status == 429) {
					let time = (parseInt(err.headers()['retry-after']) + 1) * 1000;
					setTimeout(() => {
						loadActorDetails(actor).then(resolve).catch(reject);
					}, time);
					return;
				}
				reject(err);
			});
		});
	};

	function similarActors(actor, attribution, selector) {
		function sameGender(a, b) {
			return a.male == b.male;
		}
		function aboutSameAge(a, b) {
			if (!a.birthday || !b.birthday) {
				return true;
			}
			return Math.abs(a.birthday.getFullYear() - b.birthday.getFullYear()) <= 5;
		}

		return actors.filter((a) => sameGender(a, actor) && aboutSameAge(a - actor));
	}

	function randomActor(selector, attribution) {
		var actor = selector.fromArray(actors);
		attribution.push("http://www.themoviedb.org/person/" + actor.id);
		return actor;
	}

	function actorName(actor) {
		return actor.name;
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

	function countActors() {
		return actors.length;
	}
}