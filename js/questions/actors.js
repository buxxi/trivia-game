function ActorQuestions($http) {
    var self = this;
    var actors = [];
    var ACTOR_COUNT = 500;
    var tmdbApiKey = '';
    
    var types = {
		actor_name : {
			title : (correct) => "Who is this " + (correct.male ? "actor" : "actress") + "?",
			correct : randomActor,
			similar : loadSimilarActors,
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
        return new Promise((resolve, reject) => {
            loadActors(progress, cache).then((data) => {
                actors = data;
                resolve();
            }).catch(reject);
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
			}).catch(reject);
		});
	}

	function loadActors(progress, cache) {
		return cache.get('actors', (resolve, reject) => {
			var result = [];

			function loadActorDetails(index) {
				if (!index) {
					index = 0;
				}

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
							loadActorDetails(index).then(detailResolve).catch(detailReject);
						}
					}).catch((err) => {
						if (err.status == 429) {
							var time = (parseInt(err.headers()['retry-after']) + 1) * 1000;
							setTimeout(() => {
								loadActorDetails(index).then(detailResolve).catch(detailReject);
							}, time);
							return;
						}
						detailReject(err);
					});
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
							loadPage(page++).then(pageResolve).catch(pageReject);
						} else {
							pageResolve();
						}
					}).catch(pageReject);
				});
			}

			loadPage(1).then(loadActorDetails).then(() => { resolve(result) }).catch(reject);
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