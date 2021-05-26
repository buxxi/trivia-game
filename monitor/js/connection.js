import {Protocol, PromisifiedWebSocket} from '../js/protocol.mjs';

class MonitorToServerConnection {
    constructor(url) {
        this._url = url;
    }

    connect(forceGameId) {
        return new Promise((resolve, reject) => {
            let ws = new WebSocket(`ws://${this._url.host}${this._url.pathname}`);
            ws.onopen = () => {
                let pws = new PromisifiedWebSocket(ws, uuidv4);
                pws.send(Protocol.JOIN_MONITOR, forceGameId).then(gameId => {
                    this._pws = pws;
                    resolve(gameId);
                }).catch(reject);
            };
        });
    }

    loadCategories() {
        return this._pws.send(Protocol.LOAD_CATEGORIES, {});
    }

    loadAvatars() {
        return this._pws.send(Protocol.LOAD_AVATARS, {});
    }

    removePlayer(playerId) {
        return this._pws.send(Protocol.REMOVE_PLAYER, playerId);
    }

    clearCache() {
        return this._pws.send(Protocol.CLEAR_CACHE, {} );
    }

    startGame(config) {
        return this._pws.send(Protocol.START_GAME, config);
    }

    preloadCategory(type, progress) {
        this._pws.on(Protocol.PRELOAD_CATEGORY_PROGRESS(type)).then(data => {
            return new Promise((resolve, reject) => {
                progress(data.current, data.total);
                resolve(true);
            });
        });
        return this._pws.send(Protocol.PRELOAD_CATEGORY, type);
    }

    onPlayersChange(callback) {
        this._pws.on(Protocol.PLAYERS_CHANGED).then(players => {
            return new Promise((resolve, reject) => {
                callback(players);
                resolve();
            });
        });
    }
}

export default MonitorToServerConnection;