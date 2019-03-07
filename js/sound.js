function SoundController(game) {
	var self = this;
	var config = game.config();

	var backgroundMusic = new Pizzicato.Sound('sound/background.mp3', () => {
		backgroundMusic.volume = 0.10;
		backgroundMusic.loop = true;
	});

	var click = new Pizzicato.Sound('sound/click.mp3', () => {
		click.volume = 0.2;
	});

	var trombone = new Pizzicato.Sound('sound/sad.mp3', () => {
		trombone.volume = 0.5;
	});

	self.play = function() {
		if (!config.sound.backgroundMusic) {
			return;
		}
		backgroundMusic.play();
	}

	self.pause = function() {
		if (!config.sound.backgroundMusic) {
			return;
		}
		backgroundMusic.pause();
	}

	self.click = function() {
		if (config.sound.soundEffects) {
			click.clone().play();
		}
	}

	self.beep = function(count) {
		if (config.sound.soundEffects) {
			var beep = new Pizzicato.Sound('sound/beep.mp3', () => {
				beep.play();
				beep.sourceNode.playbackRate.value = 1.5 + (0.5 * count);
			});
		}
	}

	self.trombone = function() {
		if (config.sound.soundEffects) {
			trombone.clone().play();
		}
	}

	self.speak = function(text, callback) {
		if (config.sound.text2Speech) {
			responsiveVoice.speak(text, "US English Male", {rate : 1.1, pitch : 0.9, onend : callback});
		} else {
			callback();
		}
	}
}
