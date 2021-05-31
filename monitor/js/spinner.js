class CategorySpinner {
	constructor(flipCallback) {
		this._maxDuration = 2000;
		this._duration = 50;
		this._calcDuration = this._keepDuration;
		this._flipCallback = flipCallback;
	}

	start() {
		return new Promise((resolve, reject) => {
			let checkIfDone = () => {
				try {
					let done = this.flip();
					if (done) {
						document.querySelector(".spinner").classList.add('highlight');
						resolve();
					} else {
						setTimeout(checkIfDone, this._duration);
					}
				} catch (e) {
					reject(e);
				}
			}

			checkIfDone();
		});
	}

	flip() {
		this._flipCallback();

		this._duration = this._calcDuration(this._duration);
		let lis = document.querySelectorAll(".spinner li");
		for (var i = 0; i < lis.length; i++) {
			lis[i].style.transitionDuration = this._duration + "ms";
		}

		if (this._duration < this._maxDuration) {
			let li = lis[lis.length -1];
			if (!li) {
				return false;
			}
			let parent = li.parentNode;
			parent.removeChild(li);
			parent.insertBefore(li, parent.childNodes[0]);
			return false;
		} else {
			return true;
		}
	}

	async stop() {
		let stepsBeforeSlowingDown = this._calculateStepsBeforeSlowingDown();
		this._calcDuration = this._stepsDuration(stepsBeforeSlowingDown, this._logDuration);
	}

	_calculateStepsBeforeSlowingDown() {
		var steps = 0;
		var sum = this._duration;
		while (sum < this._maxDuration) {
			steps++;
			sum = this._logDuration(sum);
		}

		var indexOfChosen = -1;
		let lis = document.querySelectorAll(".spinner li");
		for (var i = 0; i < lis.length; i++) {
			if (lis[i].dataset.spinnerStop) {
				indexOfChosen = i;
			}
		}

		function mod (n, m) {
			return ((n % m) + m) % m;
		}

		steps = (3 - steps) - indexOfChosen;
		return mod(steps, lis.length);
	}

	_logDuration(duration) {
		return Math.max(Math.log10(duration * 0.1),1.1) * duration
	}

	_keepDuration(duration) {
		return duration;
	}

	_stepsDuration(steps, nextDuration) {
		return (duration) => {
			if (steps == 0) {
				this._calcDuration = nextDuration;
			}
			steps--;
			return duration;
		}
	};
}

export default CategorySpinner;