import {Protocol, PromisifiedWebSocket} from '../js/protocol.mjs';

class ClientToServerConnection {
    constructor(url) {
        this._url = url;
    }

    connected() {
        return !!this._pws && this._pws.connected();
    }

    connect(gameId, userName, preferredAvatar) {
        return new Promise((resolve, reject) => {
            let ws = new WebSocket(`ws://${this._url.host}${this._url.pathname}`);
            ws.onopen = () => {
                let pws = new PromisifiedWebSocket(ws, uuidv4);
                pws.send(Protocol.JOIN_CLIENT, { gameId: gameId, userName: userName, preferredAvatar: preferredAvatar }).then((data) => {
                    this._pws = pws;
                    resolve(data);
                }).catch(reject);
            };
        });
    }

    reconnect(gameId, clientId) {
        return new Promise((resolve, reject) => {
            let ws = new WebSocket(`ws://${this._url.host}${this._url.pathname}`);
            ws.onopen = () => {
                let pws = new PromisifiedWebSocket(ws, uuidv4);
                pws.send(Protocol.JOIN_CLIENT, { gameId: gameId, clientId: clientId }).then((data) => {
                    this._pws = pws;
                    resolve(data);
                }).catch(reject);
            };
        });
    }

    async guess(answer) {
        return this._pws.send(Protocol.GUESS, answer);
    }

    onQuestionStart(callback) {
        this._pws.on(Protocol.QUESTION_START).then(answers => callback(answers));
    }

    onQuestionEnd(callback) {
        this._pws.on(Protocol.QUESTION_END).then(data => callback(data.pointsThisRound, data.correct));
    }

    onGameEnd(callback) {
        this._pws.on(Protocol.GAME_END).then(() => callback());
    }

    onDisconnect(callback) {
        return this._pws.onClose.catch(callback);
    }
}

export default ClientToServerConnection;