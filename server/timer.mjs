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


		callback(this.timeLeft(), this._percentageLeft(), this.score());
		let cancel = setInterval(() => {
			callback(this.timeLeft(), this._percentageLeft(), this.score());
			if (new Date().getTime() > this._end) {
				this._stop();
			}
		}, 100);

		this._stop = () => {
			this._running = false;
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

	_percentageLeft() {
		return Math.ceil((this._end - new Date().getTime()) / (this._end - this._start) * 100);
	}
}

export default Timer;