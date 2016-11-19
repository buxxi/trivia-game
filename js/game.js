triviaApp.service('game', function($rootScope, $interval, avatars, categories) {
	function Session(totalQuestions) {
		var self = this;
		var currentQuestion = {
			answers : {}
		};
		var previousQuestions = [];

		self.index = function() {
			return previousQuestions.length + 1;
		}

		self.total = function() {
			return totalQuestions;
		}

		self.newQuestion = function(question) {
			previousQuestions.forEach(function(q) {
				if (q.title == question.title && q.correct == question.correct) {
					throw new Error("Duplicate question");
				}
			});
			currentQuestion = question;
		}

		self.endQuestion = function() {
			previousQuestions.push(currentQuestion);
		}

		self.finished = function() {
			return previousQuestions.length < totalQuestions;
		}

		self.history = function() {
			return previousQuestions;
		}

		self.question = function() {
			return currentQuestion;
		}
	}

	function Timer(timePerQuestion, pointsPerRound) {
		var self = this;
		var start = 0;
		var end = 0;
		var running = false;

		self.timeLeft = function() {
			return Math.ceil((end - new Date().getTime()) / 1000);
		}

		self.percentageLeft = function() {
			return Math.ceil((end - new Date().getTime()) / (end - start) * 100);
		}

		self.score = function(time) {
			if (time == undefined) {
				time = new Date().getTime();
			}
			return Math.ceil((end - time) / (end - start) * pointsPerRound);
		}

		self.run = function(onStop) {
			start = new Date().getTime();
			end = start + (1000 * timePerQuestion);
			running = true;

			var cancel = $interval(function() {
				if (new Date().getTime() > end) {
					console.log("interval stopping");
					self.stop();
				}
			}, 100);

			self.stop = function() {
				running = false;
				$interval.cancel(cancel);
				onStop();
			}
		}

		self.stop = function() {}

		self.running = function() {
			return running;
		}
	}

	function Game() {
		var self = this;
		var players = {};
		var guesses = {};
		var config = {};
		var session = {};
		var timer = {};

		function calculatePoints() {
			var result = {};
			Object.keys(players).forEach(function(peerid) {
				if (self.hasGuessed(peerid) && guesses[peerid].answer == self.correctAnswer()['key']) {
					var pointsThisRound = timer.score(guesses[peerid].time) * players[peerid].multiplier;
					result[peerid] = pointsThisRound;
					players[peerid].score += pointsThisRound;
					players[peerid].correct++;
					if (config.allowMultiplier) {
						players[peerid].multiplier++;
					}
				} else if (self.hasGuessed(peerid)) {
					var pointsThisRound = timer.score(guesses[peerid].time);
					result[peerid] = -pointsThisRound;
					players[peerid].score -= pointsThisRound;
					players[peerid].wrong++;
					players[peerid].multiplier = 1;
					if (players[peerid].score < 0) {
						players[peerid].score = 0;
					}
				} else {
					players[peerid].multiplier = 1;
				}
			});
			return result;
		}

		function randomAvatar() {
			var unusedAvatars = Object.keys(avatars).filter(function(avatar) {
				return Object.keys(players).map(function(peerid) {
					return players[peerid].avatar;
				}).indexOf(avatar) == -1;
			});
			return unusedAvatars[unusedAvatars.length * Math.random() << 0];
		}

		self.players = function() {
			return players;
		}

		self.addPlayer = function(peerid, name) {
			var uniqueName = Object.keys(players).map(function(id) { return players[id].name; }).indexOf(name) == -1;
			if (!uniqueName) {
				throw new Error("The name " + name + " is already in use");
			}

			players[peerid] = {
				name : name,
				color : randomColor({ luminosity: 'dark' }),
				avatar : randomAvatar()
			};
		}

		self.removePlayer = function(peerid) {
			delete players[peerid];
		}

		self.configure = function(cfg) {
			config = cfg;
			categories.configure(cfg.categories);
			Object.keys(players).forEach(function(peerid) {
				players[peerid].score = 0;
				players[peerid].multiplier = 1;
				players[peerid].correct = 0;
				players[peerid].wrong = 0;
			});
			session = new Session(config.questions);
			timer = new Timer(config.time, config.pointsPerRound);
		}

		self.hasGuessed = function(peerid) {
			return guesses[peerid];
		}

		self.guess = function(peerid, answer) {
			guesses[peerid] = {
				answer : answer,
				time : new Date().getTime()
			};
			if (Object.keys(guesses).length == Object.keys(players).length && config.stopOnAnswers) {
				timer.stop();
			}
		}

		self.correctAnswer = function() {
			var question = session.question();
			var correct = question.correct;
			return {
				key : Object.keys(question.answers).filter(function(key) { return question.answers[key] == correct; })[0],
				answer : correct
			}
		}

		self.timer = function() {
			return timer;
		}

		self.session = function() {
			return session;
		}

		self.startTimer = function() {
			return new Promise(function(resolve, reject) {
				timer.run(function() {
					var pointsThisRound = calculatePoints();
					guesses = {};
					session.endQuestion();
					resolve(pointsThisRound);
				});
			});
		}


		self.hasMoreQuestions = function() {
			return session.finished()
		}

		self.nextQuestion = function() {
			return new Promise(function(resolve, reject) {
				categories.nextQuestion().then(function(question) {
					session.newQuestion(question);
					resolve(question);
				}).catch(reject);
			});
		}
	}

	return new Game();
});
