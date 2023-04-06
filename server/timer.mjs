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
		return (this._end - time) / 1000;
	}

	score(time) {
		if (time == undefined) {
			time = new Date().getTime();
		}
		return Math.ceil((this._end - time) / (this._end - this._start) * this._pointsPerRound);
	}

	run(callback) {
		return new Promise((resolve, reject) => {
			this._start = new Date().getTime();
			this._end = this._start + (1000 * this._timePerQuestion);
			this._running = true;

			let cancel = setInterval(() => {
				callback(Math.ceil(this.timeLeft()), this._percentageLeft(), this.score()).catch((e) => {
					this._running = false;
					clearInterval(cancel);
					reject(e);
				});
				if (new Date().getTime() > this._end) {
					this._stop();
				}
			}, 100);

			this._stop = () => {
				this._running = false;
				clearInterval(cancel);
				resolve();
			}
		});
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