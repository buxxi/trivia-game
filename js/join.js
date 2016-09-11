triviaApp.controller('joinController', function($scope, $location, $routeParams, connection) {
	var config = {
		code : "",
		name : ""
	};

	$scope.config = config;
	if ($routeParams.disconnected) {
		$scope.message = "The host closed the connection";
	}

	$scope.join = function() {
		connection.connect().then(function() {
			return connection.join(config.code, config.name);
		}).then(function() {
			$scope.$apply(function() {
				$location.path('/game');
			});
		}).catch(function(err) {
			$scope.$apply(function() {
				$scope.message = "Error when joining: " + err;
			});
		});
	}

	$scope.qrscan = function() {
		var decoder = QCodeDecoder();
		var video = document.getElementById('camera');
		video.style.display = 'inline-block';

		decoder.getVideoSources(function(err, sources) {
			if (sources) {
				sources.forEach(function(source) {
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

			decoder.decodeFromCamera(video, function(er,res) {
				if (res) {
					$scope.$apply(function() {
						config.code = res;

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
