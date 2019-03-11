class BaseConnection {
	constructor(fingerprint) {
		this._fingerprint = fingerprint;
		this._listeners = {};
		this._mediator = { pairCode : null };
		this._peers = [];
	}

	send(data) {
		if (typeof(data) == 'function') {
			console.log("Sending client specific data to " + this._peers.length + " peers");
			let sentToAll = Promise.all(this._peers.map((peer) => {
				let pairCode = peer.pairCode.substr(6); //Remove the client-prefix
				let result = data(pairCode);
				return peer.sendSync(result);
			}));
			return sentToAll;
		} else {
			console.log("Sending: " + JSON.stringify(data) + " to " + this._peers.length + " peers");
			let sentToAll = Promise.all(this._peers.map((peer) => peer.sendSync(data)));
			return sentToAll;
		}
	}

	on(eventName, listener) {
		if (typeof this._listeners[eventName] != 'object') {
			this._listeners[eventName] = [];	
		}

		this._listeners[eventName].push(listener);
	}

	_broadcast(eventName, pairCode, data) {
		if (typeof this._listeners[eventName] == 'object') {
			for (var i = 0; i < this._listeners[eventName].length; i++) {
				let listener = this._listeners[eventName][i];
				listener(pairCode, data);
			} 
		}
	}

	_broadcastDataEvent(pairCode, data) {
		if (pairCode.indexOf("client") == 0) {
			pairCode = pairCode.substr(6);
		}
		var command = Object.keys(data)[0];
		this._broadcast('data-' + command, pairCode, data[command]);
	}

	_createPeer(pairCode, reconnect) {
		const serverUrl = window.location.href.toString().substr(0, window.location.href.toString().indexOf(window.location.pathname));
		let peer = new SocketPeer({
			pairCode: pairCode.toLowerCase(),
			socketFallback: true,
			url: serverUrl + '/trivia/socketpeer/', //TODO: make this configurable instead
			reconnect: reconnect,
			autoconnect: false,
			serveLibrary: false,
			debug: false
		});
	
		peer.once('connect', () => {
			 //TODO: make a bug report that this is not triggered, server also modified to actually close the connection
			let old = peer.socket.onclose;
			peer.socket.onclose = () => {
				peer.socketConnected = false;
				peer.emit('close');
				old();
			};
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

	_timeoutAndErrorHandling(peer, reject, callback) {
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
}

class ClientConnection extends BaseConnection {
	constructor(fingerprint) {
		super(fingerprint);
	}

	join(pairCode, name, avatar) {
		return new Promise((resolve, reject) => {
			this._fingerprint.get((id) => {
				this._mediator = this._createPeer('mediator' + pairCode, false);

				this._timeoutAndErrorHandling(this._mediator, reject, async (timeout, cleanUp) => {
					try {
						await this._mediator.connectSync();
						await this._mediator.sendSync({
							join : { name : name, pairCode : id, avatar : avatar }
						});

						clearTimeout(timeout);

						let peer = await this._connect(id);
						cleanUp();
						this._peers = [peer];
						resolve();
					} catch(reason) {
						cleanUp();
						reject(reason);
					};
				});

				this._mediator.connect();
			});
		});
	}

	reconnect() {
		return new Promise((resolve, reject) => {
			this._fingerprint.get(async (id) => {
				try {
					let peer = await this._connect(id);
					this._peers = [peer];
					resolve();
				} catch(e) {
					reject(e);
				}
			});
		});
	}

	connected() {
		return this._peers.reduce((res, val) => {
			return res || val.socketConnected || val.rtcConnected;
		}, false);
	}

	_connect(id) {
		return new Promise((resolve, reject) => {
			let peer = this._createPeer('client' + id, false);

			this._timeoutAndErrorHandling(peer, reject, async (timeout) => {
				await peer.connectSync();
				clearTimeout(timeout);

				peer.removeAllListeners('close');
				peer.removeAllListeners('error');

				peer.on('dataevent', (data) => {
					this._broadcastDataEvent(peer.pairCode, data);
				});

				peer.on('close', () => {
					this._broadcast('connection-closed', peer.pairCode, {});
				});

				resolve(peer);
			});

			peer.connect();
		});
	}
}

class ConnectionListener extends BaseConnection {
	constructor(fingerprint) {
		super(fingerprint);
	}

	host(joinCallback) {
		return new Promise((resolve, reject) => {
			this._fingerprint.get((id) => {
				if (this._mediator.pairCode != null) {
					return resolve(id);
				}

				this._mediator = this._createPeer('mediator' + id, true);

				this._mediator.once('error', (err) => {
					reject(err);
				});

				this._mediator.on('dataevent', (data) => {
					joinCallback(data.join); //This will throw an exception that will be returned to the client, depends on the client closing the connection after that...
					this._connect(data.join.pairCode).then(() => this._mediator.close());
				});

				this._mediator.connect();
				this._sanityCheck().then(() => resolve(id)).catch(reject);
			});
		});
	}

	close(pairCode) {
		let peer = this._peerFromPairCode(pairCode);
		peer.destroy();
		this._peers = this._peers.filter((p) => p.pairCode != peer.pairCode);
	}

	disconnect() {
		this._mediator.close();
	}

	usingFallback(pairCode) {
		try {
			return !this._peerFromPairCode(pairCode).rtcConnected;
		} catch (e) {
			return true;
		}
	}

	connectionError(pairCode) {
		try {
			let peer = this._peerFromPairCode(pairCode);
			return !peer.rtcConnected && !peer.socketConnected;
		} catch (e) {
			return true;
		}
	}

	_peerReconnected(peer) {
		for (var i = 0; i < this._peers.length; i++) {
			if (peer.pairCode == this._peers[i].pairCode) {
				return true;
			}
		}
		return false;
	}

	_peerFromPairCode(pairCode) {
		for (var i = 0; i < this._peers.length; i++) {
			if (this._peers[i].pairCode == 'client' + pairCode) {
				return this._peers[i];
			}
		}
		throw new Error("No peer with Pair Code: " + pairCode);
	}

	_sanityCheck() {
		return new Promise((resolve, reject) => {
			let checkPeer = this._createPeer(this._mediator.pairCode, false);
			checkPeer.on('error', reject);
			checkPeer.on('connect', () => {
				this._mediator.once('close', () => {
					this._mediator.removeAllListeners('error');
					resolve();
				});
	
				checkPeer.close();
			});
			checkPeer.connect();
		});
	}

	_connect(pairCode) {
		return new Promise((resolve, reject) => {
			let peer = this._createPeer('client' + pairCode, true);

			this._timeoutAndErrorHandling(peer, reject, async (timeout) => {
				try {
					await peer.connectSync();
					clearTimeout(timeout);

					if (this._peerReconnected(peer)) {
						this._broadcast('connection-upgraded', peer.pairCode, {});
					} else {
						this._peers.push(peer);
					}

					peer.removeAllListeners('error');
					peer.removeAllListeners('close');

					peer.on('dataevent', (data) => {
						this._broadcastDataEvent(peer.pairCode, data);
					});

					peer.on('upgrade', () => {
						this._broadcast('connection-upgraded', peer.pairCode, {});
					});

					peer.on('close', () => {
						peer.rtcConnected = false; //This can be delayed, so the gui wont be updated correctly. Lets just set the property here, what could go wrong?
						this._broadcast('connection-closed', peer.pairCode, {});
					});

					resolve();
				} catch (e) {
					peer.destroy();
				}
			});

			peer.connect();
		});
	}
}

export {ClientConnection, ConnectionListener};