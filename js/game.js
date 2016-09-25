triviaApp.service('game', function($rootScope, $interval, categories) {
	function Game() {
		var self = this;
		var players = {};
		var currentQuestion = { answers : {} };
		var guesses = {};
		var previousQuestions = [];

		var timer = {
			start : 0,
			end : 0,
			running : false,

			timeLeft : function() {
				return Math.ceil((this.end - new Date().getTime()) / 1000);
			},
			percentageLeft : function() {
				return Math.ceil((this.end - new Date().getTime()) / (this.end - this.start) * 100);
			},
			score : function() {
				return timerPoints(new Date().getTime())
			}
		};
		var config = {};

		function timerPoints(guessTime) {
			return Math.ceil((timer.end - guessTime) / (timer.end - timer.start) * config.pointsPerRound);
		}

		function calculatePoints() {
			var result = {};
			Object.keys(players).forEach(function(peerid) {
				if (self.hasGuessed(peerid) && guesses[peerid].answer == self.correctAnswer()['key']) {
					var pointsThisRound = timerPoints(guesses[peerid].time) * players[peerid].multiplier;
					result[peerid] = pointsThisRound;
					players[peerid].score += pointsThisRound;
					players[peerid].correct++;
					if (config.allowMultiplier) {
						players[peerid].multiplier++;
					}
				} else if (self.hasGuessed(peerid)) {
					var pointsThisRound = timerPoints(guesses[peerid].time);
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
				color : randomColor()
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
			var correct = currentQuestion.correct;
			return {
				key : Object.keys(currentQuestion.answers).filter(function(key) { return currentQuestion.answers[key] == correct; })[0],
				answer : correct
			}
		}

		self.timer = function() {
			return timer;
		}

		self.startTimer = function() {
			return new Promise(function(resolve, reject) {
				timer.start = new Date().getTime();
				timer.end = timer.start + (1000 * config.time);
				timer.running = true;

				var stop = $interval(function() {
					if (new Date().getTime() > timer.end) {
						timer.stop();
					}
				}, 100);
				timer.stop = function() {
					timer.running = false;
					$interval.cancel(stop);
					var pointsThisRound = calculatePoints();
					guesses = {};
					previousQuestions.push(currentQuestion);
					resolve(pointsThisRound);
				};
			});
		}

		self.previousQuestions = function() {
			return previousQuestions;
		}

		self.hasMoreQuestions = function() {
			return previousQuestions.length < config.questions;
		}

		self.nextQuestion = function() {
			return new Promise(function(resolve, reject) {
				categories.nextQuestion().then(function(question) {
					currentQuestion = question;
					resolve(question);
				});
			});
		}
	}

	return new Game();
});
