const uuid = require('uuid').v4;

class ResponseListener {
	constructor(id, resolve, reject) {
		this.id = id;
		this._resolve = resolve;
		this._reject = reject;
	}

	listener(responseData) {
		this._resolve(responseData);
	}

	error(message) {
		this._reject(message);
	}

	isRequestListener() {
		return false;
	}

	isResponseListener(id) {
		return this.id === id;
	}
}

class RequestListener {
	constructor(event, once, resolve) {
		this.event = event;
		this.once = once;
		this._resolve = resolve;
	}

	listener(data, id) {
		this._resolve(data, id);
	}

	isRequestListener(event) {
		return this.event === event;
	}

	isResponseListener() {
		return false;
	}
}

class PromisifiedWebSocket {
    constructor(ws) {
        this._ws = ws;
        this._listeners = [];
        this._ws.on('message', (message) => {
            this._processListeners(message);
        });
    }

    send(event, requestData, timeout) {
        return Promise.race([new Promise((resolve, reject) => {
			let id = uuid();
            this._listeners.push(new ResponseListener(id, resolve, reject));  
			this._request(event, id, requestData);
        }), this._timeout(timeout)]);
    }

	once(event, timeout) {
		return this._on(event, timeout, true);
	}

    on(event) {
		return this._on(event, undefined, false);
    }

	_on(event, timeout, once) {
		let self = this;
		var listener;
		var listenerPromise;
        return {
            then: function(f) {
				listenerPromise = new Promise((resolve, reject) => {
					listener = new RequestListener(event, once, (data, id) => {
						resolve([data, id]);
					});
					self._listeners.push(listener); 
				});
				listenerPromise.then(([data, id]) => {
					self._sendResponse(data, id, f);
				});
				return this;
            },
			catch: function(f) {
				if (timeout && once) {
					Promise.race([listenerPromise, self._timeout(timeout)]).catch(err => {
						self._listeners = self._listeners.filter(l => l !== listener);
						f(err);
					});	
				}
				return this;
			}
        }
	}

	async _sendResponse(data, id, f) {
		var p = f(data);
		if (!(p instanceof Promise)) {
			p = new Promise((resolve, reject) => {
				reject(new Error("Returned data from listener function is not a Promise"));
			});
		}
		try {
			let data = await p;
			this._response(id, data);
		} catch (e) {
			this._errorResponse(id, e);
		}
	} 

    _processListeners(message) {
		let obj = this._receive(message);

        if ("request" in obj) {
			let listener = this._resolveListener(l => l.isRequestListener(obj.request.event));
			if (listener) {
				listener.listener(obj.request.data, obj.request.id);
			} else {
				this._errorResponse(obj.request.id, new Error("Not listening for this event"));
			}
        } else if ("response" in obj) {
			this._resolveListener(l => l.isResponseListener(obj.response.id)).listener(obj.response.data, obj.response.id);
        } else if ("error" in obj) {
			this._resolveListener(l => l.isResponseListener(obj.error.id)).error(obj.error.message, obj.error.id);
		}
    }

	_resolveListener(filter) {
		let matchingListeners = this._listeners.filter(filter);
		if (matchingListeners.length > 1) {
			throw new Error("Matching more than one listener");
		} else if (matchingListeners.length === 1) {
			let listener = matchingListeners[0];
			if (listener.once) {
				this._listeners = this._listeners.filter(l => l !== listener);
			}
			return listener;
		} else {
			return undefined;
		}
	}

	_timeout(timeout) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				reject(new Error("Timeout reached"));
			}, timeout);
		});
	}

	_send(response) {
		console.debug("SEND: " + JSON.stringify(response));
		this._ws.send(JSON.stringify(response));
	}

	_receive(message) {
		console.debug("RECEIVE " + message);
        let obj = JSON.parse(message);
		return obj;
	}

    _request(event, id, data) {
        this._send({
            'request' : {
                'id' : id,
                'event' : event,
                'data' : data
            }
        });
    }

	_response(id, data) {
		this._send({
			'response' : {
				'id' : id,
				'data' : data
			}
		});
	}

	_errorResponse(id, error) {
		this._send({
			'error' : {
				'id' : id,
				'message' : error.message
			}
		});
	}
}

module.exports = PromisifiedWebSocket;