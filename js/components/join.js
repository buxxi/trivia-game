import avatars from '../avatars.js';

function resolveBackCamera() {
	return new Promise((resolve, reject) => {
		navigator.mediaDevices.enumerateDevices().then((sources) => {
			var backCamera = sources.find((source) => {
				return source.kind == "videoinput" && source.label.toLowerCase().indexOf('back') != -1;
			});
			if (backCamera) {
				resolve(navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: backCamera.deviceId } } }));
			} else {
				resolve(navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } }));
			}
		});
	});
}

export default {
	data: function() { return({
		config: {
			code : this.code,
			name : "",
			avatar : ""
		},
		supportsCamera: QCodeDecoder().hasGetUserMedia(),
		avatars: avatars,
		message : undefined
	})},
	props: ['code', 'connection'],
	methods: {
		join: function() {
			this.connection.join(this.config.code, this.config.name, this.config.avatar).then(() => {
				this.$router.push('game');
			}).catch((err) => {
				this.message = "Error when joining: " + err;
			});
		},
		
		qrscan: function() {
			var decoder = QCodeDecoder();
			var video = document.getElementById('camera');
			video.style.display = 'inline-block';

			resolveBackCamera().then((stream) => {
				if ("srcObject" in video) {
					video.srcObject = stream;
				} else {
					video.src = window.URL.createObjectURL(stream);
				}

				function stop() {
					video.style.display = 'none';
					stream.getTracks()[0].stop();
				}

				video.addEventListener('click', stop);

				decoder.decodeFromVideo(video, (err, res) => {
					if (res) {
						config.code = /.*\?code=(.*)/.exec(res)[1];

						if (!!config.name) {
							this.join();
						}

						stop();
					}
				}, true);
			});
		}
	}
};