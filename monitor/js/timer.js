export default function Timer(timePerQuestion, pointsPerRound) {
	var self = this;
	var start = 0;
	var end = 0;
	var running = false;

	self.timeLeft = function(time) {
		if (time == undefined) {
			time = new Date().getTime();
		}
		return Math.ceil((end - time) / 1000);
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

	self.run = function(callback, onStop) {
		start = new Date().getTime();
		end = start + (1000 * timePerQuestion);
		running = true;

		callback(self);
		var cancel = setInterval(() => {
			callback(self);
			if (new Date().getTime() > end) {
				console.log("interval stopping");
				self.stop();
			}
		}, 100);

		self.stop = function() {
			running = false;
			clearInterval(cancel);
			onStop();
		}
	}

	self.stop = function() {}

	self.running = function() {
		return running;
	}
}