triviaApp.controller('joinController', function($scope, $location, $routeParams, connection) {
	var config = {
		code : $routeParams.code,
		name : ""
	};

	$scope.config = config;
	$scope.supportsCamera = QCodeDecoder().hasGetUserMedia();

	if ($routeParams.disconnected) {
		$scope.message = "The host closed the connection";
	}

	$scope.join = function() {
		connection.join(config.code, config.name).then(() => {
			$scope.$apply(() => {
				$location.path('/game');
			});
		}).catch((err) => {
			$scope.$apply(() => {
				$scope.message = "Error when joining: " + err;
			});
		});
	}

	$scope.qrscan = function() {
		var decoder = QCodeDecoder();
		var video = document.getElementById('camera');
		video.style.display = 'inline-block';

		decoder.getVideoSources((err, sources) => {
			if (sources) {
				sources.forEach((source) => {
					if (source.facing == 'environment') {
						decoder.setSourceId(source.id);
					}
				});
			}

			function stop() {
				video.style.display = 'none';
				decoder.stream.getTracks()[0].stop();
			}

			video.addEventListener('click', stop);

			decoder.decodeFromCamera(video, (er,res) => {
				if (res) {
					$scope.$apply(() => {
						config.code = /.*\?code=(.*)/.exec(res)[1];

						if (!!config.name) {
							$scope.join();
						}

						stop();
					});
				}
			}, true);
		});
	};
});
