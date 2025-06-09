import * as h from 'howler';

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

		this._backgroundMusic = backgroundMusic;
		this._click = click;
		this._trombone = trombone;
		this._applauds = applauds;
	}

	config(config) {
		this._config = config;
	}

	play() {
		if (!this._config.backgroundMusic || this._backgroundMusic.playing()) {
			return;
		}
		this._backgroundMusic.play();
	}

	pause() {
		if (!this._config.backgroundMusic || !this._backgroundMusic.playing()) {
			return;
		}
		
		this._backgroundMusic.pause();
	}

	click() {
		if (this._config.soundEffects) {
			this._click.play();
		}
	}

	beep(count) {
		if (this._config.soundEffects) {
			new Howl({
				src: ['sound/beep.mp3'], 
				autoplay: true,
				rate: 1.5 + (0.5 * count)
			});
		}
	}

	trombone() {
		if (this._config.soundEffects) {
			this._trombone.play();
		}
	}

	applauds() {
		if (this._config.soundEffects) {
			this._applauds.play();
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
