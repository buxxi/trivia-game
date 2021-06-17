class BlankPlayer {
	constructor() {
		this.pauseMusic = false;
		this.minimizeQuestion = false;
	}
	
	async start() {}

	stop() {}
}

class ImageViewer {
	constructor(url) {
		this.url = url;
		this.pauseMusic = false;
		this.minimizeQuestion = true;
	}

	start() {
		let url = this.url;
		return new Promise((resolve, reject) => {
			var img = new Image();
			img.onload = () => {
				document.getElementById('content').innerHTML = '<div class="image" id="player"><img src="' + url + '"/></div>';
				resolve();
			};
			img.onerror = () => {
				reject("Could not load image " + url);
			};
			img.src = url;
		});
	}

	stop() {
		clear();
	}
}

class YoutubePlayer {
	constructor(videoId, playerClass) {
		this.videoId = videoId;
		this.playerClass = playerClass;
		this.player = {};
		this.pauseMusic = true;
		this.minimizeQuestion = true;
	}

	start() {
		let self = this;
		
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="' + self.playerClass + '" id="player"><div id="video"></div></div>';

			var startTimeout = setTimeout(() => {
				self.stop();
				reject("Didn't start playback before timeout");
			}, 5000);

			self.player = new YT.Player('video', {
				height: '100%',
				width: '100%',
				videoId: self.videoId,
				playerVars : {
					autoplay : 1,
					controls : 0,
					hd : 1
				},
				events: {
					onStateChange: (state) => {
						if (state.data == 1) {
							clearTimeout(startTimeout);
							document.getElementById("player").classList.add('playing');
							resolve();
						}
					}
				}
			});
		});
	}

	stop() {
		this.player.stopVideo();
		clear();
	}
}

class Mp3WavePlayer {
	constructor(mp3) {
		this.mp3 = mp3;
		this.player = {};
		this.pauseMusic = true;
		this.minimizeQuestion = true;
	}

	start() {
		let self = this;
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="wavesurfer" id="player"></div>';
			self.player = WaveSurfer.create({
				container: '#player',
				waveColor: 'white',
				progressColor: '#337ab7',
				cursorColor : '#133451',
				cursorWidth : 3,
				barWidth : 3
			});

			self.player.on('ready', () => {
				self.player.setVolume(0.3);
				self.player.play();
				resolve();
			});

			self.player.on('error', (err) => {
				reject(new Error(err + ": " + self.mp3));
			});

			self.player.load(self.mp3);
		});
	}

	stop() {
		this.player.stop();
		this.player.destroy();
		clear();
	}
}

class QuoteText {
	constructor(quote) {
		this.quote = quote;
		this.pauseMusic = false;
		this.minimizeQuestion = true;
	}

	async start() {
		let quote = this.quote;
		document.getElementById('content').innerHTML = '<div class="quote" id="player"><i class="fa fa-fw fa-quote-left"></i><p>' + quote + '</p><i class="fa fa-fw fa-quote-right"></i></div>';
	}

	stop() {
		clear();
	}
}

class ListViewer {
	constructor(list) {
		this.list = list;
		this.pauseMusic = false;
		this.minimizeQuestion = true;
	}

	async start() {
		let list = this.list;
		document.getElementById('content').innerHTML = '<div class="list" id="player"><ol><li>' + list.join("</li><li>") + '</li></ol></i></div>';
	}

	stop() {
		clear();
	}
}

class AnswersViewer {
	constructor(answers) {
		this.answers = answers;
		this.pauseMusic = false;
		this.minimizeQuestion = true;
	}

	async start() {
		let answers = this.answers;
		document.getElementById('content').innerHTML = '<div class="list-answers" id="player"><ol>' +
			'<li class="button-icon-A">' + answers.A + '</li>' +
			'<li class="button-icon-B">' + answers.B + '</li>' +
			'<li class="button-icon-C">' + answers.C + '</li>' +
			'<li class="button-icon-D">' + answers.D + '</li>' +
			'</ol></i></div>';
	}

	stop() {
		clear();
	}
}

function clear() {
	document.getElementById('content').innerHTML = '';
}

class PlaybackFactory {
	constructor() {
		this._players = {
			youtube : (view, answers) => new YoutubePlayer(view.videoId, view.player),
			youtubeaudio : (view, answers) => new YoutubePlayer(view.videoId, view.player),
			mp3 : (view, answers) => new Mp3WavePlayer(view.mp3),
			image : (view, answers) => new ImageViewer(view.url),
			quote : (view, answers) => new QuoteText(view.quote),
			list : (view, answers) => new ListViewer(view.list),
			answers : (view, answers) => new AnswersViewer(answers)
		}
	}

	load(view, answers) {
		if (!view.player) {
			return new BlankPlayer();
		}
		return this._players[view.player](view, answers);
	}
}

export default PlaybackFactory;
