function JoinController($scope, $location, $routeParams, connection, avatars) {
	var config = {
		code : $routeParams.code,
		name : "",
		avatar : ""
	};

	let app = new Vue({
		el: '.join',
		data: {
			config: config,
			supportsCamera: QCodeDecoder().hasGetUserMedia(),
			avatars: avatars,
			message : undefined
		},
		methods: {
			join: function() {
				connection.join(config.code, config.name, config.avatar).then(() => {
					$scope.$apply(() => {
						$location.path('/game');
					});
				}).catch((err) => {
					app.message = "Error when joining: " + err;
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
								app.join();
							}

							stop();
						}
					}, true);
				});
			}
		}
	});

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
}
