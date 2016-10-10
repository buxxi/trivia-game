triviaApp.service('sound', function() {
	function BackgroundMusic() {
		var self = this;
		var enabled = false;

		var sound = new Pizzicato.Sound('sound/background.mp3', function() {
			sound.volume = 0.10;
			sound.loop = true;
		});

		self.play = function() {
			if (!enabled) {
				return;
			}
			sound.play();
		}

		self.pause = function() {
			if (!enabled) {
				return;
			}
			sound.pause();
		}

		self.toggle = function(enable) {
			if (enable) {
				sound.play();
				enabled = true;
			} else {
				sound.pause();
				enabled = false;
			}
		}

		self.beep = function(count) {
			if (enabled) {
				var beep = new Pizzicato.Sound('sound/beep.mp3', function() {
					beep.play();
					beep.sourceNode.playbackRate.value = 1.5 + (0.5 * count);
				});
			}
		}

		self.speak = function(text) {
			if (enabled) {
				responsiveVoice.speak(text, "US English Male", {rate : 1.1, pitch : 0.9});
			}
		}

		self.stopSpeaking = function() {
			//responsiveVoice.cancel();
		}
	}

	return new BackgroundMusic();
});
