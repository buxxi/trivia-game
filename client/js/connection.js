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
                pws.send(Protocol.JOIN_CLIENT, { gameId: gameId, userName: userName, preferredAvatar: preferredAvatar }).then((clientId) => {
                    this._pws = pws;
                    resolve(clientId);
                }).catch(reject);
            };
        });
    }

    async reconnect(gameId, clientId) {

    }

    async guess(answer) {
        
    }

    onQuestionStart(callback) {
        //callback(answers)
    }

    onQuestionEnd(callback) {
        //callback(pointsThisRound, correct)
    }

    onGameEnd(callback) {
        //callback();
    }

    onDisconnect(callback) {
        //callback();
    }
}

export default ClientToServerConnection;