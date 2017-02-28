function Connection($rootScope) {
	var self = this;
	var mediator = { pairCode : null };
	var serverUrl = window.location.href.toString().substr(0, window.location.href.toString().indexOf(window.location.pathname));
	var peers = [];

	function dataEvent(pairCode, data) {
		if (pairCode.indexOf("client") == 0) {
			pairCode = pairCode.substr(6);
		}
		var command = Object.keys(data)[0];
		var params = data[command];
		$rootScope.$broadcast('data-' + command, pairCode, params);
	}

	self.disconnect = function() {
		mediator.close();
	}

	self.host = function(joinCallback) {
		return new Promise((resolve, reject) => {
			new Fingerprint2().get((id) => {
				mediator = createPeer('mediator' + id, true);

				mediator.once('error', (err) => {
					reject(err);
				});

				mediator.on('data', (data) => {
					if (data.join) {
						serverToClient(data.join).then((d) => {
							joinCallback(d);
							mediator.close();
						});
					}
				});

				sanityCheck = createPeer('mediator' + id, false);
				sanityCheck.on('connect', () => {
					mediator.once('close', () => {
						mediator.removeAllListeners('error');
						resolve(id);
					});

					sanityCheck.close();
				});
				mediator.connect();
				sanityCheck.connect();
			});
		});
	}

	self.join = function(pairCode, name) {
		return new Promise((resolve, reject) => {
			new Fingerprint2().get((id) => {
				mediator = createPeer('mediator' + pairCode, false);

				timeoutAndErrorHandling(mediator, reject, (timeout, cleanUp) => {
					mediator.once('connect', () => {
						mediator.send({
							join : { name : name, pairCode : id }
						});

						clearTimeout(timeout);

						clientToServer(id).then((peer) => {
							cleanUp();
							peers = [peer];
							resolve();
						}).catch((reason) => {
							cleanUp();
							reject(reason);
						});
					});
				});

				mediator.connect();
			});
		});
	}

	self.reconnect = function() {
		return new Promise((resolve, reject) => {
			new Fingerprint2().get((id) => {
				clientToServer(id).then((peer) => {
						peers = [peer];
						resolve();
				}).catch(reject);
			});
		});
	}

	self.close = function(pairCode) {
		var peer = peerFromPairCode(pairCode);
		peer.destroy();
		peers = peers.filter((p) => p.pairCode != peer.pairCode);
	}

	self.send = function(data) {
		console.log("Sending: " + JSON.stringify(data) + " to " + peers.length + " peers");
		peers.forEach((peer) => {
			peer.send(data);
		});
	}

	self.connected = function() {
		return peers.reduce((res, val) => {
			return res || val.socketConnected || val.rtcConnected;
		}, false);
	}

	self.usingFallback = function(pairCode) {
		try {
			return !peerFromPairCode(pairCode).rtcConnected;
		} catch (e) {
			return true;
		}
	}

	self.connectionError = function(pairCode) {
		try {
			var peer = peerFromPairCode(pairCode);
			return !peer.rtcConnected && !peer.socketConnected;
		} catch (e) {
			return true;
		}
	}

	function serverToClient(data) {
		return new Promise((resolve, reject) => {
			var peer = createPeer('client' + data.pairCode, true);

			timeoutAndErrorHandling(peer, reject, (timeout) => {
				peer.on('connect', () => {
					try {
						clearTimeout(timeout);

						if (peerReconnected(peer)) {
							$rootScope.$broadcast('connection-upgraded', peer);
						} else {
							peers.push(peer);
						}

						peer.removeAllListeners('error');
						peer.removeAllListeners('close');

						peer.send({
							join : true
						});

						peer.on('data', (data) => {
							dataEvent(peer.pairCode, data);
						});

						peer.on('upgrade', () => {
							$rootScope.$broadcast('connection-upgraded', peer);
						});

						peer.on('close', () => {
							peer.rtcConnected = false; //This can be delayed, so the gui wont be updated correctly. Lets just set the property here, what could go wrong?
							$rootScope.$broadcast('connection-closed', peer);
						});

						resolve(data);
					} catch (e) {
						peer.send({
							join : e.message
						});
						peer.destroy();
					}
				});
			});

			peer.connect();
		});
	}

	function clientToServer(id) {
		return new Promise((resolve, reject) => {
			var peer = createPeer('client' + id, false);

			timeoutAndErrorHandling(peer, reject, (timeout) => {
				peer.once('connect', () => {
					peer.once('data', function(data) {
						clearTimeout(timeout);

						peer.removeAllListeners('close');
						peer.removeAllListeners('error');

						if (data.join == true) {
							peer.on('data', (data) => {
								dataEvent(peer.pairCode, data);
							});

							peer.on('close', () => {
								$rootScope.$broadcast('connection-closed', peer);
							});

							resolve(peer);
						} else {
							peer.close();
							reject(data.join);
						}
					});
				});
			});

			peer.connect();
		});
	}

	function peerReconnected(peer) {
		for (var i = 0; i < peers.length; i++) {
			if (peer.pairCode == peers[i].pairCode) {
				return true;
			}
		}
		return false;
	}

	function timeoutAndErrorHandling(peer, reject, callback) {
		function cleanUp() {
			peer.removeAllListeners('close');
			peer.removeAllListeners('connect');
			peer.removeAllListeners('error');
			peer.removeAllListeners('data');
			peer.close();
		}

		peer.once('close', () => {
			cleanUp();
			reject("Connection closed");
		});

		peer.once('error', (err) => {
			cleanUp();
			reject("Connection error: " + err);
		});

		var timeout = setTimeout(() => {
			cleanUp();
			reject('No one listening on Pair Code ' + peer.pairCode);
		}, 3000);

		callback(timeout, cleanUp);
	}

	function createPeer(pairCode, reconnect) {
		var peer = new SocketPeer({
			pairCode: pairCode.toLowerCase(),
			socketFallback: true,
			url: serverUrl + '/socketpeer/',
			reconnect: reconnect,
			autoconnect: false,
			serveLibrary: false,
			debug: false
		});

		peer.once('connect', () => {
			fixCloseEvent(peer);
		});
		return peer;
	}

	function fixCloseEvent(peer) { //TODO: make a bug report that this is not triggered, server also modified to actually close the connection
		var old = peer.socket.onclose;
		peer.socket.onclose = () => {
			peer.socketConnected = false;
			peer.emit('close');
			old();
		};
		return peer;
	}

	function peerFromPairCode(pairCode) {
		for (var i = 0; i < peers.length; i++) {
			if (peers[i].pairCode == 'client' + pairCode) {
				return peers[i];
			}
		}
		throw new Error("No peer with Pair Code: " + pairCode);
	}
};
