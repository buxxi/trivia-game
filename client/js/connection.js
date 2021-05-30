import {Protocol, PromisifiedWebSocket} from '../js/protocol.mjs';

class ClientToServerConnection {
    constructor(url) {
        this._url = url;
    }

    connected() {
        return !!this._pws;
    }

    connect(gameId, userName, preferredAvatar) {
        return Promise.resolve();
    }
}

export default ClientToServerConnection;