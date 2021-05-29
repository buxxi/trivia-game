import {Protocol, PromisifiedWebSocket} from '../js/protocol.mjs';

class MonitorToServerConnection {
    constructor(url) {
        this._url = url;
    }

    connected() {
        return !!this._pws;
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
        return this._pws.send(Protocol.PRELOAD_CATEGORY, type).then(count => {
            this._pws.remove(Protocol.PRELOAD_CATEGORY_PROGRESS(type));
            return count;
        });
    }

    onPlayersChange(callback) {
        this._pws.on(Protocol.PLAYERS_CHANGED).then(players => callback(players));
    }

    onCategorySelect(callback) {
       this._pws.on(Protocol.SHOW_CATEGORY_SELECT).then(data => callback(data.categories, data.correct, data.index, data.total));
    }

    onPlayerGuessed(callback) {
        this._pws.on(Protocol.PLAYER_GUESSED).then(id => callback(id));
    }

    onQuestion(callback) {
        this._pws.on(Protocol.SHOW_QUESTION).then(text => callback(text));
    }

    onQuestionError(callback) {
        this._pws.on(Protocol.QUESTION_ERROR).then(message => callback(message));
    }

    onQuestionStart(callback) {
        this._pws.on(Protocol.QUESTION_START).then(data => callback(data.view, data.answers));
    }

    onQuestionEnd(callback) {
        this._pws.on(Protocol.QUESTION_END).then(data => callback(data.pointsThisRound, data.correct));
    }

    onGameEnd(callback) {
        this._pws.on(Protocol.GAME_END).then((data) => callback(data.history, data.players));
    }

    clearListeners() {
        this._pws.removeAll();
    }
}

export default MonitorToServerConnection;