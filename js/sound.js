triviaApp.service('sound', function() {
	function SoundController() {
		var self = this;

		var enabled = {
			backgroundMusic : false,
			soundEffects : true,
			text2Speech : true
		}

		var backgroundMusic = new Pizzicato.Sound('sound/background.mp3', function() {
			backgroundMusic.volume = 0.10;
			backgroundMusic.loop = true;
		});

		self.play = function() {
			if (!enabled.backgroundMusic) {
				return;
			}
			backgroundMusic.play();
		}

		self.pause = function() {
			if (!enabled.backgroundMusic) {
				return;
			}
			backgroundMusic.pause();
		}

		self.configure = function(config) {
			enabled = config;
			if (enabled.backgroundMusic) {
				backgroundMusic.play();
			} else {
				backgroundMusic.pause();
			}
		}

		self.beep = function(count) {
			if (enabled.soundEffects) {
				var beep = new Pizzicato.Sound('sound/beep.mp3', function() {
					beep.play();
					beep.sourceNode.playbackRate.value = 1.5 + (0.5 * count);
				});
			}
		}

		self.speak = function(text, callback) {
			if (enabled.text2Speech) {
				responsiveVoice.speak(text, "US English Male", {rate : 1.1, pitch : 0.9, onend : callback});
			} else {
				callback();
			}
		}

		self.enabled = function() {
			return enabled;
		}
	}

	return new SoundController();
});
