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
			gameId : this.gameId,
			name : "",
			avatar : ""
		},
		supportsCamera: QCodeDecoder().hasGetUserMedia(),
		avatars: [],
		message : undefined
	})},
	computed: {
		validated: function() {
			return this.config.gameId && this.config.name;
		}
	},
	props: ['gameId', 'connection'],
	methods: {
		join: function() {
			this.connection.connect(this.config.gameId, this.config.name, this.config.avatar).then((clientId) => {
				console.log(clientId);
				this.$router.push({ path: "/game", query : { gameId: this.config.gameId, clientId: clientId } });
			}).catch((err) => {
				this.message = "Error when joining: " + err.message;
			});
		},
		
		qrscan: function() {
			let config = this.config;
			let decoder = QCodeDecoder();
			let video = document.getElementById('camera');
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
						config.gameId = /.*\?gameId=(.*)/.exec(res)[1];

						if (!!config.name) {
							this.join();
						}

						stop();
					}
				}, true);
			});
		}
	},
	created: async function() {
		console.log(this.gameId);
		let request = await fetch("avatars.json");
		let avatars = await request.json();
		avatars.forEach((avatar) => this.avatars.push(avatar));
	}
};