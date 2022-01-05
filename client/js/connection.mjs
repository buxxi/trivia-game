import {Protocol, PromisifiedWebSocket} from '../../common/js/protocol.mjs';

class ClientToServerConnection {
    constructor(url) {
        if (url instanceof URL) {
            if (url.protocol === 'https:') {
                this._url = `wss://${url.host}${url.pathname}`;
            } else {
                this._url = `ws://${url.host}${url.pathname}`;
            }
        } else {
            this._url = url;
        }
    }

    connected() {
        return !!this._pws && this._pws.connected();
    }

    connect(gameId, userName, preferredAvatar) {
        return this._connect({ gameId: gameId, userName: userName, preferredAvatar: preferredAvatar });
    }

    reconnect(gameId, clientId) {
        return this._connect({ gameId: gameId, clientId: clientId });
    }

    async guess(answer) {
        return this._pws.send(Protocol.GUESS, answer);
    }

    onQuestionStart() {
        return this._pws.on(Protocol.QUESTION_START);
    }

    onQuestionEnd() {
        return this._pws.on(Protocol.QUESTION_END);
    }

    onGameEnd() {
        return this._pws.on(Protocol.GAME_END);
    }

    onClose() {
        return this._pws.onClose;
    }

    close() {
        this._pws.close();
    }

    _connect(payload) {
        return new Promise((resolve, reject) => {
            let ws = new WebSocket(this._url);
            ws.onopen = () => {
                let pws = new PromisifiedWebSocket(ws, uuidv4);
                pws.send(Protocol.JOIN_CLIENT, payload).then((data) => {
                    this._pws = pws;
                    this._pws.on(Protocol.PING).then(async () => "pong");
                    resolve(data);
                }).catch(reject);
            };
        });
    }
}

export default ClientToServerConnection;