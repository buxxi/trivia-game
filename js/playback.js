function BlankPlayer() {
	var self = this;

	self.start = function() {
		return new Promise((resolve, reject) => {
			resolve();
		});
	}

	self.stop = noop;

	self.pauseMusic = false;
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
}

function YoutubePlayer(videoId, playerClass) {
	var self = this;
	var player = {};

	self.start = function() {
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="' + playerClass + '" id="player"></div>';

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
							resolve();
						} else {
							reject('got youtube state: ' + state.data);
						}
					}
				}
			});
		});
	}

	self.stop = function() {
		player.stopVideo();
	}

	self.pauseMusic = true;
}

function Mp3Player(category, mp3) {
	var self = this;
	var player = {};

	self.start = function() {
		return new Promise((resolve, reject) => {
			document.getElementById('content').innerHTML = '<div class="wavesurfer" id="player"></div>';
			player = WaveSurfer.create({
				container: '#player',
				waveColor: 'white',
				progressColor: '#337ab7'
			});

			player.on('ready', () => {
				player.setVolume(0.3);
				player.play();
				resolve();
			});

			player.load(mp3);
		});
	}

	self.stop = function() {
		player.stop();
		player.destroy();
	}

	self.pauseMusic = true;
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
}

function noop() {}

function Playback() {
	var self = this;

	var players = {
		youtube : (view) => new YoutubePlayer(view.videoId, view.player),
		youtubeaudio : (view) => new YoutubePlayer(view.videoId, view.player),
		mp3 : (view) => new Mp3Player(view.category, view.mp3),
		image : (view) => new ImageViewer(view.url),
		quote : (view) => new QuoteText(view.quote),
		list : (view) => new ListViewer(view.list)
	}

	self.player = function(view) {
		if (!view.player) {
			return new BlankPlayer();
		}
		return players[view.player](view);
	}
}
