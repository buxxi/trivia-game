function Connection(fingerprint) {
	var self = this;
	var mediator = { pairCode : null };
	var serverUrl = window.location.href.toString().substr(0, window.location.href.toString().indexOf(window.location.pathname));
	var peers = [];
	var listeners = {};

	function dataEvent(pairCode, data) {
		if (pairCode.indexOf("client") == 0) {
			pairCode = pairCode.substr(6);
		}
		var command = Object.keys(data)[0];
		broadcast('data-' + command, pairCode, data[command]);
	}

	self.disconnect = function() {
		mediator.close();
	}

	self.host = function(joinCallback) {
		return new Promise((resolve, reject) => {
			fingerprint.get((id) => {
				if (mediator.pairCode != null) {
					return resolve(id);
				}

				mediator = createPeer('mediator' + id, true);

				mediator.once('error', (err) => {
					reject(err);
				});

				mediator.on('dataevent', (data) => {
					joinCallback(data.join); //This will throw an exception that will be returned to the client, depends on the client closing the connection after that...
					serverToClient(data.join.pairCode).then(() => mediator.close());
				});

				mediator.connect();
				sanityCheck(mediator).then(() => resolve(id)).catch(reject);
			});
		});
	}

	self.join = function(pairCode, name, avatar) {
		return new Promise((resolve, reject) => {
			fingerprint.get((id) => {
				mediator = createPeer('mediator' + pairCode, false);

				timeoutAndErrorHandling(mediator, reject, async (timeout, cleanUp) => {
					try {
						await mediator.connectSync();
						await mediator.sendSync({
							join : { name : name, pairCode : id, avatar : avatar }
						});

						clearTimeout(timeout);

						let peer = await clientToServer(id);
						cleanUp();
						peers = [peer];
						resolve();
					} catch(reason) {
						cleanUp();
						reject(reason);
					};
				});

				mediator.connect();
			});
		});
	}

	self.reconnect = function() {
		return new Promise((resolve, reject) => {
			fingerprint.get(async (id) => {
				try {
					let peer = await clientToServer(id);
					peers = [peer];
					resolve();
				} catch(e) {
					reject(e);
				}
			});
		});
	}

	self.close = function(pairCode) {
		var peer = peerFromPairCode(pairCode);
		peer.destroy();
		peers = peers.filter((p) => p.pairCode != peer.pairCode);
	}

	self.send = function(data) {
		if (typeof(data) == 'function') {
			console.log("Sending client specific data to " + peers.length + " peers");
			let sentToAll = Promise.all(peers.map((peer) => {
				let pairCode = pairCodeFromPeer(peer);
				let result = data(pairCode);
				return peer.sendSync(result);
			}));
			return sentToAll;
		} else {
			console.log("Sending: " + JSON.stringify(data) + " to " + peers.length + " peers");
			let sentToAll = Promise.all(peers.map((peer) => peer.sendSync(data)));
			return sentToAll;
		}
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

	self.on = function(eventName, listener) {
		if (typeof listeners[eventName] != 'object') {
			listeners[eventName] = [];	
		}

		listeners[eventName].push(listener);
	}

	function broadcast(eventName, pairCode, data) {
		if (typeof listeners[eventName] == 'object') {
			for (var i = 0; i < listeners[eventName].length; i++) {
				let listener = listeners[eventName][i];
				listener(pairCode, data);
			} 
		}
	}

	function serverToClient(pairCode) {
		return new Promise((resolve, reject) => {
			var peer = createPeer('client' + pairCode, true);

			timeoutAndErrorHandling(peer, reject, async (timeout) => {
				try {
					await peer.connectSync();
					clearTimeout(timeout);

					if (peerReconnected(peer)) {
						broadcast('connection-upgraded', peer.pairCode, {});
					} else {
						peers.push(peer);
					}

					peer.removeAllListeners('error');
					peer.removeAllListeners('close');

					peer.on('dataevent', (data) => {
						dataEvent(peer.pairCode, data);
					});

					peer.on('upgrade', () => {
						broadcast('connection-upgraded', peer.pairCode, {});
					});

					peer.on('close', () => {
						peer.rtcConnected = false; //This can be delayed, so the gui wont be updated correctly. Lets just set the property here, what could go wrong?
						broadcast('connection-closed', peer.pairCode, {});
					});

					resolve();
				} catch (e) {
					peer.destroy();
				}
			});

			peer.connect();
		});
	}

	function clientToServer(id) {
		return new Promise((resolve, reject) => {
			var peer = createPeer('client' + id, false);

			timeoutAndErrorHandling(peer, reject, async (timeout) => {
				await peer.connectSync();
				clearTimeout(timeout);

				peer.removeAllListeners('close');
				peer.removeAllListeners('error');

				peer.on('dataevent', (data) => {
					dataEvent(peer.pairCode, data);
				});

				peer.on('close', () => {
					broadcast('connection-closed', peer.pairCode, {});
				});

				resolve(peer);
			});

			peer.connect();
		});
	}

	function sanityCheck(mediator) {
		return new Promise((resolve, reject) => {
			checkPeer = createPeer(mediator.pairCode, false);
			checkPeer.on('error', reject);
			checkPeer.on('connect', () => {
				mediator.once('close', () => {
					mediator.removeAllListeners('error');
					resolve();
				});

				checkPeer.close();
			});
			checkPeer.connect();
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
			url: serverUrl + '/trivia/socketpeer/', //TODO: make this configurable instead
			reconnect: reconnect,
			autoconnect: false,
			serveLibrary: false,
			debug: false
		});

		peer.once('connect', () => {
			fixCloseEvent(peer);
		});

		peer.sendSync = function(data) {
			return new Promise((resolve, reject) => {
				let key = Math.random().toString(32);

				var timeout;

				let responseListener = (data) => {
					if (data.sync && data.sync.key == key) {
						clearTimeout(timeout);
						peer.removeListener('data', responseListener);
						if (data.sync.response) {
							resolve();
						} else {
							reject(data.sync.message);
						}
					}
				};

				timeout = setTimeout(() => {
					peer.removeListener('data', responseListener);
					reject("Got no response in time");
				}, 2000);

				peer.on('data', responseListener);

				peer.send({
					sync : {
						key : key,
						data : data
					}
				});
			});
		}

		peer.connectSync = function() {
			return new Promise((resolve, reject) => {
				peer.once('connect', resolve);
			});
		}

		peer.on('data', function(data) {
			if (!data.sync) {
				peer.emit('dataevent', data);
			} else {
				if ('response' in data.sync) {
					return;
				}
				try {
					peer.emit('dataevent', data.sync.data);
					peer.send({
						sync : {
							key : data.sync.key,
							response : true
						}
					})
				} catch (e) {
					peer.send({
						sync : {
							key : data.sync.key,
							response : false,
							message : e.toString()
						}
					})
				}
			}
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

	function pairCodeFromPeer(peer) {
		return peer.pairCode.substr(6);
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
