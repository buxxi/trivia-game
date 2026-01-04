import * as h from 'howler';

const RATE_STEPS = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];

class SoundController {
	constructor() {
		this._ = h; //No ESM module, keeping reference to avoid auto import to remove it
		this._config = {
			backgroundMusic : true,
			soundEffects : true,
			text2Speech : true
		};

		let backgroundMusic = new Howl({
			src: ['sound/background.mp3'], 
			volume: 0.10,
			loop: true
		});

		let click = new Howl({
			src: ['sound/click.mp3'],
			volume: 0.2
		});

		let trombone = new Howl({
			src: ['sound/sad.mp3'],
			volume: 0.5
		});

		let applauds = new Howl({
			src: ['sound/applauds.mp3'], 
			volume: 0.5
		});

		let ticktock = new Howl({
			src: ['sound/ticktock.mp3'],
			volume: 0.5,
			loop: true
		});

		this._backgroundMusic = backgroundMusic;
		this._click = click;
		this._trombone = trombone;
		this._applauds = applauds;
		this._ticktock = ticktock;
		this._rateEffectsIntervals = [];
	}

	config(config) {
		this._config = config;
	}

	resumeBackgroundMusic() {
		if (this._config.soundEffects) {
			this._ticktock.stop();
		}
		if (this._config.backgroundMusic && this._backgroundMusic.rate() < 1) {
			this._stepBackgroundMusicRate(RATE_STEPS.slice().reverse());
		}
		if (!this._config.backgroundMusic || this._backgroundMusic.playing()) {
			return;
		}
		this._backgroundMusic.play();
	}

	pauseBackgroundMusic() {
		if (!this._config.backgroundMusic || !this._backgroundMusic.playing()) {
			return;
		}
		
		this._backgroundMusic.pause();
	}

	spinnerClick() {
		if (this._config.soundEffects) {
			this._click.play();
		}
	}

	playerGuessed(count) {
		if (this._config.soundEffects) {
			new Howl({
				src: ['sound/beep.mp3'], 
				autoplay: true,
				rate: 1.5 + (0.5 * count)
			});
		}
	}

	maxMultiplierLost() {
		if (this._config.soundEffects) {
			this._trombone.play();
		}
	}

	allGuessedCorrect() {
		if (this._config.soundEffects) {
			this._applauds.play();
		}		
	}

	celebrateVictory() {
		if (this._config.soundEffects) {
			this._applauds.play();
		}
	}

	timerWarning() {
		if (this._config.backgroundMusic) {
			this._stepBackgroundMusicRate(RATE_STEPS);
		}
		if (this._config.soundEffects) {
			this._ticktock.play();
		}
	}

	_stepBackgroundMusicRate(rateValues) {
		this._rateEffectsIntervals.forEach(clearInterval);
		this._rateEffectsIntervals = [];
		rateValues.forEach((rate, i) => {
			this._rateEffectsIntervals.push(setTimeout(() => {
				this._backgroundMusic.rate(rate);
			}, i * 100));
		});
	}

	speak(gameId, ttsId, minimumTime, silenceAfterTime) {
		return new Promise((resolve, reject) => {
			let startTime = new Date().getTime();
			if (!this._config.text2Speech) {
				setTimeout(resolve, minimumTime);
				return;
			}

			let url = new URL("../tts", document.location).toString() + "?gameId=" + gameId + "&ttsId=" + ttsId;
			
			let speak = new Howl({
				src: [url],
				format: ['wav'],
				autoplay: true,
				onloaderror: () => {
					reject(new Error("Failed to load text2speech for: " + ttsId));	
				},
				onend: () => {
					let elapsedTime = new Date().getTime() - startTime;
					setTimeout(resolve, Math.max(silenceAfterTime, minimumTime - elapsedTime));
				}
			});
		});
	}
}

export default SoundController;
