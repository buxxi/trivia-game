triviaApp.service('connection', function($rootScope) {
	function Connection() {
		var self = this;
		var currentPairCode = null;
		var serverUrl = window.location.href.toString().substr(0, window.location.href.toString().indexOf(window.location.pathname));
		var peers = [];

		function dataEvent(conn, data) {
			var command = Object.keys(data)[0];
			var params = data[command];
			$rootScope.$broadcast('data-' + command, conn, params);
		}

		self.disconnect = function() {
			//TODO:
		}

		self.host = function() {
			return new Promise(function(resolve, reject) {
				function openNextSlot(result) {
					var peer = createPeer(result + "-" + (peers.length + 1));

					peer.on('data', function(data) {
						dataEvent(peer, data);
					});

					peer.on('connect', function() {
						peers.push(peer);
						openNextSlot(result);
					});

					currentPairCode = peer.pairCode;
					peer.connect();
				}

				new Fingerprint2().get(function(result) {
					openNextSlot(result);

					resolve();
				});
			});
		}

		self.join = function(pairCode, name) {
			return new Promise(function(resolve, reject) {
				var peer = createPeer(pairCode);
				currentPairCode = pairCode;

				peer.on('error', function(err) {
					reject(err);
				});

				peer.on('data', function(data) {
					dataEvent(peer, data);
				});

				var timeout = setTimeout(function() {
					peer.close();
					reject("No one listening on Pair Code " + pairCode);
				}, 3000);

				var removeWait = $rootScope.$on('data-wait', function() {
					resolve();
					removeWait();
					clearTimeout(timeout);
				});

				var removeError = $rootScope.$on('data-kicked', function(event, conn, params) {
					peer.close();
					reject(params);
					removeError();
				});

				peer.on('connect', function() {
					peers.push(peer);
					peer.send({
						join : { name : name }
					});
				});

				peer.connect();
			});
		}

		self.close = function(pairCode) {
			var peer = peerFromPairCode(pairCode);
			peer.send({
				kicked : "The host kicked you"
			});
			peer.close();
		}

		self.send = function(data) {
			peers.forEach(function(peer) {
				peer.send(data);
			});
		}

		self.code = function() {
			return currentPairCode;
		}

		self.usingFallback = function(pairCode) {
			return !peerFromPairCode(pairCode).rtcConnected;
		}

		function createPeer(pairCode) {
			return new SocketPeer({
				pairCode: pairCode.toLowerCase(),
				socketFallback: true,
				url: serverUrl + '/socketpeer/',
				reconnect: false,
				autoconnect: false,
				serveLibrary: false,
				debug: false
			});
		}

		function peerFromPairCode(pairCode) {
			for (var i = 0; i < peers.length; i++) {
				if (peers[i].pairCode == pairCode) {
					return peers[i];
				}
			}
			throw new Error("No peer with Pair Code: " + pairCode);
		}
	};

	return new Connection();
});
