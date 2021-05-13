export default function CategorySpinner(categories, flipCallback, show) {
	var self = this;

	var jokeChance = 0.5;
	var maxDuration = 2000;

	var duration = 50;
	var calcDuration = keepDuration;

	self.categories = loadCategories(categories);

	self.start = function() {
		return new Promise((resolve, reject) => {
			if (!show) {
				resolve();
				return;
			}

			var checkIfDone = () => {
				try {
					var done = self.flip();
					if (done) {
						document.querySelector(".spinner").classList.add('highlight');
						resolve();
					} else {
						setTimeout(checkIfDone, duration);
					}
				} catch (e) {
					reject(e);
				}
			}

			checkIfDone();
		});
	}

	self.flip = function() {
		flipCallback();

		duration = calcDuration(duration);
		var lis = document.querySelectorAll(".spinner li");
		for (var i = 0; i < lis.length; i++) {
			lis[i].style.transitionDuration = duration + "ms";
		}

		if (duration < maxDuration) {
			var li = lis[lis.length -1];
			var parent = li.parentNode;
			parent.removeChild(li);
			parent.insertBefore(li, parent.childNodes[0]);
			return false;
		} else {
			return true;
		}
	}

	self.stop = function() {
		return new Promise((resolve, reject) => {
			var stepsBeforeSlowingDown = calculateStepsBeforeSlowingDown();
			calcDuration = stepsDuration(stepsBeforeSlowingDown, logDuration);
			resolve();
		});
	}

	function loadCategories(categories) {
		if (!show) {
			return [];
		}
		var result = categories.enabled();
		var insertJoke = Math.random() >= jokeChance;
		while (result.length < 6 || insertJoke) {
			if (insertJoke) {
				result.push(categories.joke());
			}
			result = result.concat(categories.enabled()); //TODO: shuffle this array?
			insertJoke = Math.random() >= jokeChance;
		}
		return result;
	}

	function calculateStepsBeforeSlowingDown() {
		var steps = 0;
		var sum = duration;
		while (sum < maxDuration) {
			steps++;
			sum = logDuration(sum);
		}

		var indexOfChosen = -1;
		var lis = document.querySelectorAll(".spinner li");
		for (var i = 0; i < lis.length; i++) {
			if (lis[i].dataset.spinnerStop) {
				indexOfChosen = i;
			}
		}

		var mod = (n, m) => {
			return ((n % m) + m) % m;
		}

		var steps = (3 - steps) - indexOfChosen;
		return mod(steps, lis.length);
	}

	function logDuration(duration) {
		return Math.max(Math.log10(duration * 0.1),1.1) * duration
	}

	function keepDuration(duration) {
		return duration;
	}

	function stepsDuration(steps, nextDuration) {
		return (duration) => {
			if (steps == 0) {
				calcDuration = nextDuration;
			}
			steps--;
			return duration;
		}
	};
}