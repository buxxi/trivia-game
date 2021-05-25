class SoundController {
	constructor() {
		this._config = {
			backgroundMusic : true,
			soundEffects : true,
			text2Speech : true
		};

		let backgroundMusic = new Pizzicato.Sound('sound/background.mp3', () => {
			backgroundMusic.volume = 0.10;
			backgroundMusic.loop = true;
		});

		let click = new Pizzicato.Sound('sound/click.mp3', () => {
			click.volume = 0.2;
		});

		let trombone = new Pizzicato.Sound('sound/sad.mp3', () => {
			trombone.volume = 0.5;
		});

		this._backgroundMusic = backgroundMusic;
		this._click = click;
		this._trombone = trombone;
	}

	config(config) {
		this._config = config;
	}

	play() {
		if (!this._config.backgroundMusic) {
			return;
		}
		this._backgroundMusic.play();
	}

	pause() {
		if (!this._config.backgroundMusic) {
			return;
		}
		this._backgroundMusic.pause();
	}

	click() {
		if (this._config.soundEffects) {
			this._click.clone().play();
		}
	}

	beep(count) {
		if (this._config.soundEffects) {
			let beep = new Pizzicato.Sound('sound/beep.mp3', () => {
				beep.play();
				beep.sourceNode.playbackRate.value = 1.5 + (0.5 * count);
			});
		}
	}

	trombone() {
		if (this._config.soundEffects) {
			this._trombone.clone().play();
		}
	}

	speak(text, callback) {
		if (this._config.text2Speech) {
			responsiveVoice.speak(text, "US English Male", {rate : 1.1, pitch : 0.9, onend : callback});
		} else {
			callback();
		}
	}
}

export default SoundController;
