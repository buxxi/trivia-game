class BlankPlayer {
	constructor() {
		this.pauseMusic = false;
		this.minimizeQuestion = false;
	}
	
	start() {
		return new Promise((resolve, reject) => {
			resolve();
		});
	}

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
		console.log(playerClass);
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

class Mp3Player {
	constructor(mp3) {
		this.mp3 = mp3;
		this.player = {};
		this.pauseMusic = true;
		this.minimizeQuestion = true;
	}

	start() {
		let self = this;

		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div id="player"></div>';
			self.player = new Audio();
			self.player.addEventListener('canplaythrough', () => {
				self.player.play();
				resolve();
			});
			self.player.addEventListener('error', (err) => {
				reject(err);
			});
			self.player.src = self.mp3;
		});
	}

	stop() {
		clear();
		this.player.pause();
		this.player = null;
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
				if (err.trim() == "XHR error:") {
					self.loadFallback(resolve, reject); //TODO: this is not defined?
				} else {
					reject(err);
				}
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

	start() {
		let quote = this.quote;
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="quote" id="player"><i class="fa fa-fw fa-quote-left"></i><p>' + quote + '</p><i class="fa fa-fw fa-quote-right"></i></div>';
			resolve();
		});
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
	start() {
		let list = this.list;
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="list" id="player"><ol><li>' + list.join("</li><li>") + '</li></ol></i></div>';
			resolve();
		});
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

	start() {
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="list-answers" id="player"><ol>' +
				'<li class="btn-A">' + answers.A + '</li>' +
				'<li class="btn-B">' + answers.B + '</li>' +
				'<li class="btn-C">' + answers.C + '</li>' +
				'<li class="btn-D">' + answers.D + '</li>' +
				'</ol></i></div>';
			resolve();
		});
	}

	stop() {
		clear();
	}
}

function clear() {
	document.getElementById('content').innerHTML = '';
}

export default function Playback() {
	var self = this;

	var players = {
		youtube : (view, answers) => new YoutubePlayer(view.videoId, view.player),
		youtubeaudio : (view, answers) => new YoutubePlayer(view.videoId, view.player),
		mp3 : (view, answers) => view.nowave ? new Mp3Player(view.mp3) : new Mp3WavePlayer(view.mp3),
		image : (view, answers) => new ImageViewer(view.url),
		quote : (view, answers) => new QuoteText(view.quote),
		list : (view, answers) => new ListViewer(view.list),
		answers : (view, answers) => new AnswersViewer(answers)
	}

	self.player = function(view, answers) {
		if (!view.player) {
			return new BlankPlayer();
		}
		return players[view.player](view, answers);
	}
}
