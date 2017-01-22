triviaApp.service('connection', function($rootScope) {
	function Connection() {
		var self = this;
		var mediator = { pairCode : null };
		var serverUrl = window.location.href.toString().substr(0, window.location.href.toString().indexOf(window.location.pathname));
		var peers = [];

		function dataEvent(pairCode, data) {
			var command = Object.keys(data)[0];
			var params = data[command];
			$rootScope.$broadcast('data-' + command, pairCode, params);
		}

		self.disconnect = function() {
			mediator.close();
		}

		self.host = function(joinCallback) {
			return new Promise(function(resolve, reject) {
				new Fingerprint2().get(function(id) {
					mediator = createPeer(id);

					mediator.on('error', function(err) {
						reject(err);
					});

					mediator.on('data', function(data) {
						if (data.join) {
							mediator.close();

							var peer = createPeer(data.join.pairCode);
							peer.on('connect', function() {
								try {
									joinCallback(data.join);
									peers.push(peer);
									peer.send({
										join : true
									});
								} catch (e) {
									console.log(e);
									peer.send({
										join : e.message
									})
									peer.close();
								}
								mediator.connect();
							});
							peer.on('data', function(data) {
								dataEvent(peer.pairCode, data);
							});

							peer.on('upgrade', function() {
								$rootScope.$broadcast('connection-upgraded', peer);
							});

							peer.connect();
						}
					});

					sanityCheck = createPeer(id);
					sanityCheck.on('upgrade', function() {
						fixCloseEvent(sanityCheck);
						sanityCheck.on('close', function() {
							mediator.connect();
							resolve();
						});
						mediator.close();
						sanityCheck.close();
					});
					mediator.connect();
					sanityCheck.connect();
				});
			});
		}

		self.join = function(pairCode, name) {
			return new Promise(function(resolve, reject) {
				new Fingerprint2().get(function(id) {
					mediator = createPeer(pairCode);

					mediator.on('error', function(err) {
						reject(err);
					});

					var timeout = setTimeout(function() {
						mediator.close();
						reject("No one listening on Pair Code " + pairCode);
					}, 3000);

					mediator.on('connect', function() {
						mediator.send({
							join : { name : name, pairCode : id }
						});

						mediator.close();

						var peer = createPeer(id);
						peer.on('connect', function() {
							clearTimeout(timeout);
							fixCloseEvent(peer);
							peers.push(peer);

							peer.on('data', function(data) {
								dataEvent(peer.pairCode, data);
							});

							$rootScope.$on('data-join', function(event, id, data) {
								if (data === true) {
									resolve();
								} else {
									reject(data);
								}
							});
						});

						peer.on('close', function() {
							$rootScope.$broadcast('connection-closed', peer);
						});

						peer.connect();
					});

					mediator.connect();
				});
			});
		}

		self.close = function(pairCode) {
			var peer = peerFromPairCode(pairCode);
			peer.close();
		}

		self.send = function(data) {
			console.log("Sending: " + JSON.stringify(data) + " to " + peers.length + " peers");
			peers.forEach(function(peer) {
				peer.send(data);
			});
		}

		self.code = function() {
			return mediator.pairCode;
		}

		self.usingFallback = function(pairCode) {
			try {
				return !peerFromPairCode(pairCode).rtcConnected;
			} catch (e) {
				return true;
			}
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

		function fixCloseEvent(peer) { //TODO: make a bug report that this is not triggered, server also modified to actually close the connection
			var old = peer.socket.onclose;
			peer.socket.onclose = function() {
				peer.emit('close');
				old();
			};
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
