const Protocol = {
	JOIN_MONITOR: "JOIN_MONITOR",
	LOAD_CATEGORIES: "LOAD_CATEGORIES",
	LOAD_AVATARS: "LOAD_AVATARS",
	REMOVE_PLAYER: "REMOVE_PLAYER",
	CLEAR_CACHE: "CLEAR_CACHE",
	START_GAME: "START_GAME",
	PRELOAD_CATEGORY: "PRELOAD_CATEGORY",
	PRELOAD_CATEGORY_PROGRESS: (category) => "PRELOAD_CATEGORY_PROGRESS_" + category,
	PLAYERS_CHANGED: "PLAYERS_CHANGED",

	QUESTION_ERROR: "QUESTION_ERROR",
	GAME_END: "GAME_END",
	SHOW_CATEGORY_SELECT: "SHOW_CATEGORY_SELECT",
	SHOW_QUESTION: "SHOW_QUESTION",
	QUESTION_START: "QUESTION_START",
	QUESTION_END: "QUESTION_END",
	PLAYER_GUESSED: "PLAYER_GUESSED"
}

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
		this._reject(new Error(message));
	}

	isRequestListener() {
		return false;
	}

	isResponseListener(id) {
		return this.id === id;
	}
}

class RequestListener {
	constructor(event, resolve) {
		this.event = event;
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
    constructor(ws, uuidGenerator) {
		this._uuidGenerator = uuidGenerator;
        this._ws = ws;
        this._listeners = [];
		if ('onmessage' in this._ws) { //Browser
			this._ws.onmessage = (message) => {
				this._processListeners(message);
			};
		} else if ('on' in this._ws) { //Server
			this._ws.on('message', (message) => {
				this._processListeners(message);
			});
		}
    }

    send(event, requestData, timeout) {
        return Promise.race([new Promise((resolve, reject) => {
			let id = this._uuidGenerator();
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

	remove(event) {
		this._listeners = this._listeners.filter(l => !l.isRequestListener(event));
	}

	removeAll() {
		this._listeners = [];
	}

	_on(event, timeout, once) {
		if (!event) {
			throw new Error("An event must be provided");
		}
		let self = this;

		var errorFunction = (e) => { console.log("Unhandled timeout error: " + e.message); };

        return {
            then: function(f) {
				var listener;
				var requestReceived = () => {};
				let responsePromise = new Promise((resolve, reject) => {
					requestReceived = resolve;
				});
				listener = new RequestListener(event, (data, id) => {
					requestReceived();
					self._sendResponse(data, id, f);
				});
				self._listeners.push(listener); 

				if (once) {
					Promise.race([responsePromise, self._timeout(timeout)]).then(() => {
						self.remove(event);
					}).catch(err => {
						self.remove(event);
						errorFunction(err);
					});	
				}

				return this;
            },
			catch: function(f) {
				errorFunction = f;
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
				this._errorResponse(obj.request.id, new Error("Not listening for this event: " + obj.request.event));
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
		if (!timeout) {
			return new Promise((resolve, reject) => {});
		}
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				reject(new Error("Timeout reached"));
			}, timeout);
		});
	}

	_send(response) {
		//console.debug("SEND: " + JSON.stringify(response));
		this._ws.send(JSON.stringify(response));
	}

	_receive(message) {
		if ('data' in message) { //Browser
			message = message.data;
		}
		//console.debug("RECEIVE " + message);
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

export {PromisifiedWebSocket as PromisifiedWebSocket, Protocol as Protocol};