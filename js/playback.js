function BlankPlayer() {
	var self = this;

	self.start = function() {
		return new Promise((resolve, reject) => {
			resolve();
		});
	}

	self.stop = noop;
	self.pauseMusic = false;
	self.minimizeQuestion = false;
}

function ImageViewer(url) {
	var self = this;

	self.start = function() {
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


	self.stop = noop;
	self.pauseMusic = false;
	self.minimizeQuestion = true;
}

function YoutubePlayer(videoId, playerClass) {
	var self = this;
	var player = {};

	self.start = function() {
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="' + playerClass + '" id="player"></div>';

			var startTimeout = setTimeout(() => {
				self.stop();
				reject("Didn't start playback before timeout");
			}, 5000);

			player = new YT.Player('player', {
				height: '100%',
				width: '100%',
				videoId: videoId,
				playerVars : {
					autoplay : 1,
					showinfo : 0,
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

	self.stop = function() {
		player.stopVideo();
		document.getElementById('content').innerHTML = '<div id="player"></div>';
	}

	self.pauseMusic = true;
	self.minimizeQuestion = true;
}

function Mp3Player(mp3) {
	var self = this;
	var player =  {};

	self.start = function() {
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div id="player"></div>';
			player = new Audio();
			player.addEventListener('canplaythrough', () => {
				player.play();
				resolve();
			});
			player.addEventListener('error', (err) => {
				reject(err);
			});
			player.src = mp3;
		});
	}

	self.stop = function() {
		player.pause();
		player = null;
	}
}

function Mp3WavePlayer(mp3) {
	var self = this;
	var player = {};

	self.start = function() {
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="wavesurfer" id="player"></div>';
			player = WaveSurfer.create({
				container: '#player',
				waveColor: 'white',
				progressColor: '#337ab7',
				cursorColor : '#133451',
				cursorWidth : 3,
				barWidth : 3
			});

			player.on('ready', () => {
				player.setVolume(0.3);
				player.play();
				resolve();
			});

			player.on('error', (err) => {
				if (err.trim() == "XHR error:") {
					self.loadFallback(resolve, reject);
				} else {
					reject(err);
				}
			});

			player.load(mp3);
		});
	}

	self.stop = function() {
		player.stop();
		player.destroy();
	}

	self.pauseMusic = true;
	self.minimizeQuestion = true;
}

function QuoteText(quote) {
	var self = this;

	self.start = function() {
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="quote" id="player"><i class="fa fa-fw fa-quote-left"></i><p>' + quote + '</p><i class="fa fa-fw fa-quote-right"></i></div>';
			resolve();
		});
	}

	self.stop = noop;

	self.pauseMusic = false;
	self.minimizeQuestion = true;
}

function ListViewer(list) {
	var self = this;

	self.start = function() {
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="list" id="player"><ol><li>' + list.join("</li><li>") + '</li></ol></i></div>';
			resolve();
		});
	}

	self.stop = noop;

	self.pauseMusic = false;
	self.minimizeQuestion = true;
}

function AnswersViewer(answers) {
	var self = this;

	self.start = function() {
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

	self.stop = noop;

	self.pauseMusic = false;
	self.minimizeQuestion = true;
}

function noop() {}

function Playback() {
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
