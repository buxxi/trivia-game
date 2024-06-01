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

		let applauds = new Pizzicato.Sound('sound/applauds.mp3', () => {
			applauds.volume = 0.5;
		});

		this._backgroundMusic = backgroundMusic;
		this._click = click;
		this._trombone = trombone;
		this._applauds = applauds;
	}

	config(config) {
		this._config = config;
	}

	play() {
		if (!this._config.backgroundMusic || this._backgroundMusic.playing) {
			return;
		}
		this._backgroundMusic.play();
	}

	pause() {
		if (!this._config.backgroundMusic || this._backgroundMusic.paused) {
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

	applauds() {
		if (this._config.soundEffects) {
			this._applauds.clone().play();
		}		
	}

	speak(gameId, ttsId, minimumTime, silenceAfterTime) {
		return new Promise((resolve, reject) => {
			let startTime = new Date().getTime();
			if (!this._config.text2Speech) {
				setTimeout(resolve, minimumTime);
				return;
			}

			let url = new URL("../tts", document.location).toString() + "?gameId=" + gameId + "&ttsId=" + ttsId;
			
			let speak = new Pizzicato.Sound(url, () => {
				try {
					speak.play();
				} catch (e) {
					reject(new Error("Failed to load text2speech for: " + ttsId));
				}
			});
			speak.on('end', () => {
				let elapsedTime = new Date().getTime() - startTime;
				setTimeout(resolve, Math.max(silenceAfterTime, minimumTime - elapsedTime));
			});
		});
	}
}

export default SoundController;
