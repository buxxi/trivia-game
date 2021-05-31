const Protocol = {
	JOIN_MONITOR: "JOIN_MONITOR",
	LOAD_CATEGORIES: "LOAD_CATEGORIES",
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
	PLAYER_GUESSED: "PLAYER_GUESSED",
	TIMER_TICK: "TIMER_TICK",

	JOIN_CLIENT: "JOIN_CLIENT",
	GUESS: "GUESS"
}

class ResponseListener {
	constructor(id, resolve, reject) {
		this._id = id;
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
		return this._id === id;
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

		this._ws.onmessage = (message) => {
			this._processListeners(message);
		};
		this.onClose = new Promise((resolve, reject) => {
			this._ws.onclose = () => {
				this._clearUpOnClose();
				reject(new Error("Socket disconnected"));
			}
		});
    }

    send(event, requestData, timeout) {
		if (!this.connected()) {
			throw new Error("Can only send data while connected");
		}

        return Promise.race([new Promise((resolve, reject) => {
			let id = this._uuidGenerator();
            this._listeners.push(new ResponseListener(id, resolve, reject));  
			this._request(event, id, requestData);
        }), this._timeout(timeout)]);
    }

	once(event, timeout) {
		let self = this;
		return {
			then: function(f) {
				return Promise.race([self.on(event, true).then(f), self._timeout(timeout)]).finally(() => {
					self.remove(event);
				});
			}
		}
	}

    on(event) {
		return this._on(event, false);
    }

	onClose(func) {
		this._closeListener = func;
	}

	remove(event) {
		this._listeners = this._listeners.filter(l => !l.isRequestListener(event));
	}

	removeAll() {
		this._listeners = [];
	}

	connected() {
		return this._ws.readyState === 1;
	}

    _on(event, propagateError) {
		if (!event) {
			throw new Error("An event must be provided");
		}
		let self = this;

        return {
            then: function(f) {
				let response = new Promise((resolve, reject) => {
					let listener = new RequestListener(event, (requestData, id) => {
						self._sendResponse(requestData, id, f).then(resolve).catch((e) => {
							if (propagateError) {
								reject(e);
							} else {
								console.log("Event " + event + " got: " + e.message);
							}
						});
					});
					self._listeners.push(listener); 
				});
				return response;
			}
        }
    }

	async _sendResponse(requestData, id, f) {
		var p = f(requestData);
		if (!(p instanceof Promise)) {
			p = new Promise((resolve, reject) => {
				reject(new Error("Returned data from listener function is not a Promise"));
			});
		}
		try {
			let responseData = await p;
			this._response(id, responseData);
		} catch (e) {
			this._errorResponse(id, e);
			throw e;
		}
	} 

	_clearUpOnClose() {
		this._listeners.filter(l => l.isResponseListener(l._id)).forEach(l => l.error("Connection was closed"));
		this._listeners = [];
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
			return this.onClose;
		}
		return Promise.race([this.onClose, new Promise((resolve, reject) => {
			setTimeout(() => {
				reject(new Error("Timeout reached"));
			}, timeout);
		})]);
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