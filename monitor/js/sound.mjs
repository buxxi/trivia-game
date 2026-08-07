import backgroundMusicFile from '../sound/background.mp3';
import clickFile from '../sound/click.mp3';
import tromboneFile from '../sound/sad.mp3';
import applaudsFile from '../sound/applauds.mp3';
import ticktockFile from '../sound/ticktock.mp3';
import beepFile from '../sound/beep.mp3';

const RATE_STEPS = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];

class Sound {
	constructor(src, volume, rate) {
		this._audio = new Audio(src);
		this._audio.preload = 'auto';
		this._audio.volume = volume;
		this._audio.loop = false;
		this._audio.playbackRate = rate;
	}

	play(loop) {
		try {
			this._audio.loop = loop;
			if (!loop) {
				this._audio.currentTime = 0;
			}
			return this._audio.play();
		} catch (e) {
			return Promise.reject(e);
		}
	}

	pause() {
		try { this._audio.pause(); } catch (e) {}
	}

	stop() {
		try {
			this._audio.pause();
			this._audio.currentTime = 0;
		} catch (e) {}
	}

	get rate() {
		return this._audio.playbackRate || 1;
	}

	set rate(value) {
		this._audio.playbackRate = value;
	}

	onError(func) {
		this._audio.addEventListener('error', () => {
			try { func(); } catch (e) {}
		});
	}

	onEnd(func) {
		this._audio.addEventListener('ended', () => {
			try { func(); } catch (e) {}
		});
	}

	playing() {
		try {
			return !this._audio.paused && !this._audio.ended && this._audio.currentTime > 0;
		} catch (e) { return false; }
	}
}


class SoundController {
    constructor() {
		this._config = {
			backgroundMusic : true,
			soundEffects : true,
			text2Speech : true
		};

		let backgroundMusic = new Sound(backgroundMusicFile, 0.20, 1);

		let click = new Sound(clickFile, 0.20, 1);

		let trombone = new Sound(tromboneFile, 0.5, 1);

		let applauds = new Sound(applaudsFile, 0.5, 1);

		let ticktock = new Sound(ticktockFile, 0.5, 1);

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
		if (this._config.backgroundMusic && this._backgroundMusic.rate < 1) {
			this._stepBackgroundMusicRate(RATE_STEPS.slice().reverse());
		}
		if (!this._config.backgroundMusic || this._backgroundMusic.playing()) {
			return;
		}
		this._backgroundMusic.play(true);
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
			new Sound(beepFile, 1.0, false, 1.5 + (0.5 * count)).play(false);
		}
	}

	maxMultiplierLost() {
		if (this._config.soundEffects) {
			this._trombone.play(false);
		}
	}

	allGuessedCorrect() {
		if (this._config.soundEffects) {
			this._applauds.play(false);
		}		
	}

	celebrateVictory() {
		if (this._config.soundEffects) {
			this._applauds.play(false);
		}
	}

	timerWarning() {
		if (this._config.backgroundMusic) {
			this._stepBackgroundMusicRate(RATE_STEPS);
		}
		if (this._config.soundEffects) {
			this._ticktock.play(true);
		}
	}

	_stepBackgroundMusicRate(rateValues) {
		this._rateEffectsIntervals.forEach(clearInterval);
		this._rateEffectsIntervals = [];
		rateValues.forEach((rate, i) => {
			this._rateEffectsIntervals.push(setTimeout(() => {
				this._backgroundMusic.rate = rate;
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

			const s = new Sound(url, 1.0, 1.0);
			s.onError(() => {
				reject(new Error("Failed to load text2speech for: " + ttsId));
			});
			s.onEnd (() => {
				let elapsedTime = new Date().getTime() - startTime;
				setTimeout(resolve, Math.max(silenceAfterTime, minimumTime - elapsedTime));
			});
			s.play(false);
		});
	}
}

export default SoundController;
