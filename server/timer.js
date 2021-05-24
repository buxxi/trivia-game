class Timer {
	constructor(timePerQuestion, pointsPerRound) {
		this._timePerQuestion = timePerQuestion;
		this._pointsPerRound = pointsPerRound;
		this._start = 0;
		this._end = 0;
		this._running = false;
		this._stop = () => {};
	}

	timeLeft(time) {
		if (time == undefined) {
			time = new Date().getTime();
		}
		return Math.ceil((this._end - time) / 1000);
	}

	percentageLeft() {
		return Math.ceil((this._end - new Date().getTime()) / (this._end - this._start) * 100);
	}

	score(time) {
		if (time == undefined) {
			time = new Date().getTime();
		}
		return Math.ceil((this._end - time) / (this._end - this._start) * this._pointsPerRound);
	}

	run(callback, onStop) {
		this._start = new Date().getTime();
		this._end = this._start + (1000 * this._timePerQuestion);
		this._running = true;

		let self = this;

		callback(self);
		let cancel = setInterval(() => {
			callback(self);
			if (new Date().getTime() > self._end) {
				console.log("interval stopping");
				self._stop();
			}
		}, 100);

		self._stop = () => {
			self._running = false;
			clearInterval(cancel);
			onStop();
		}
	}

	stop() {
		this._stop();
	}

	running() {
		return this._running;
	}
}

module.exports = Timer;