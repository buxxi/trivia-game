import {Protocol, PromisifiedWebSocket} from '../../common/js/protocol.mjs';

class MonitorToServerConnection {
    constructor(url, uuidGenerator) {
        if (url.protocol === 'https:') {
            this._url = `wss://${url.host}${url.pathname}`;
        } else {
            this._url = `ws://${url.host}${url.pathname}`;
        }
        this._uuidGenerator = uuidGenerator;
    }

    connected() {
        return !!this._pws && this._pws.connected();
    }

    connect(forceGameId) {
        return new Promise((resolve, reject) => {
            let ws = new WebSocket(this._url);
            ws.onopen = () => {
                let pws = new PromisifiedWebSocket(ws, this._uuidGenerator);
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

    onPlayersChange() {
        return this._pws.on(Protocol.PLAYERS_CHANGED);
    }

    onCategorySelect() {
       return this._pws.on(Protocol.SHOW_CATEGORY_SELECT);
    }

    onPlayerGuessed() {
        return this._pws.on(Protocol.PLAYER_GUESSED);
    }

    onQuestion() {
        return this._pws.on(Protocol.SHOW_QUESTION);
    }

    onQuestionError() {
        return this._pws.on(Protocol.QUESTION_ERROR);
    }

    onQuestionStart() {
        return this._pws.on(Protocol.QUESTION_START);
    }

    onQuestionEnd() {
        return this._pws.on(Protocol.QUESTION_END);
    }

    onTimerTick() {
        return this._pws.on(Protocol.TIMER_TICK);        
    }

    onGameEnd() {
        return this._pws.on(Protocol.GAME_END);
    }

    clearListeners() {
        this._pws.removeAll();
    }
}

export default MonitorToServerConnection;