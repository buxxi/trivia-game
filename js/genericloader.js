triviaApp.service('genericloader', function($http, $interpolate, $parse, apikeys) {
	function GenericQuestion(model) {
		var self = this;

		self.title = function(correct) {
			return $interpolate(model.question.format)(correct);
		}

		self.correct = function(obj) {
			var s = model.answers.selector;
			if (s.type == "self") {
				var path = /{{(.*)}}/.exec(s.correct);
				if (!path) {
					throw new Error("model.answers.selector.correct is in incorrect format");
				}
				return $parse(path[1].trim())(obj);
			} else {
				return obj;
			}
		}

		self.similar = function(obj, questions, selector) {
			var s = model.answers.selector;
			if (s.type == "self") {
				var path = /{{(.*)}}/.exec(s.alternatives);
				if (!path) {
					throw new Error("model.answers.selector.alternatives is in incorrect format");
				}
				var answers = $parse(path[1].trim())(obj);
				if (answers.length != 4) {
					throw new Error("Expected answers to be an array of size 4");
				}

				return selector.alternatives(answers, self.correct(obj), self.format, selector.first);
			} else if (s.type == "random") {
				return selector.alternatives(questions, self.correct(obj), self.format, selector.splice);
			} else {
				throw new Error("Not implemented yet");
			}
		}

		self.format = function(answer) {
			if (typeof answer == 'string') {
				answer = { self : answer };
			}
			return $interpolate(model.answers.format)(answer);
		}

		self.attribution = function(obj) {
			return cloneAndInterpolate(obj, model.view);
		}

		function cloneAndInterpolate(data, source) {
			var clone = JSON.parse(JSON.stringify(source));
			function interpolateRecursive(obj) {
				if (typeof obj === 'string') {
					return $interpolate(obj)(data);
				}
				for (var i in obj) {
					obj[i] = interpolateRecursive(obj[i]);
				}
				return obj;
			}

			return interpolateRecursive(clone);
		}
	}

	function GenericCategory(description, questions, data) {
		var self = this;

		self.describe = function() {
			return description;
		}

		self.preload = function(progress) {
			return new Promise((resolve, reject) => {
				resolve(); //TODO: verify structure maybe?
			});
		}

		self.nextQuestion = function(selector) {
			var q = new GenericQuestion(selector.fromArray(questions));
			var d = selector.fromArray(data);

			return new Promise((resolve, reject) => {
				resolve({
					text : q.title(d),
					answers : q.similar(d, data, selector),
					correct : q.format(q.correct(d)),
					view : q.attribution(d)
				});
			});
		}
	}

	return { //TODO: extract to a 'class'
		create : function(name, input) {
			var parsed = JSON.parse(input);
			var description = parsed.description;
			description.type = name.substr(0, name.lastIndexOf("."));
			return new GenericCategory(description, parsed.questions, parsed.data);
		}
	}
});
