import {Protocol} from '../../js/protocol.mjs';
import LoadingNextQuestionState from './loadquestion.mjs';

class ConfigureState {
    constructor(game, categories, clientSockets, monitorSocket) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
    }

    run() {
        return new Promise((stateResolve, stateReject) => {
            this._monitorSocket.on(Protocol.LOAD_CATEGORIES).then(async () => {
                return this._categories.available();	
            });
    
            this._monitorSocket.on(Protocol.PRELOAD_CATEGORY).then(async (category) => {
                let count = await this._categories.preload(category, (current, total) => {
                    this._monitorSocket.send(Protocol.PRELOAD_CATEGORY_PROGRESS(category), { current: current, total: total });
                }, this._game);
                return count;
            });
    
            this._monitorSocket.on(Protocol.REMOVE_PLAYER).then(async (playerId) => {
                this._game.removePlayer(playerId);
            });
    
            this._monitorSocket.on(Protocol.CLEAR_CACHE).then(async () => {
                this._categories.clearCache();
            });
    
            this._monitorSocket.once(Protocol.START_GAME).then(async (config) => {
                this._monitorSocket.remove(Protocol.LOAD_CATEGORIES);
                this._monitorSocket.remove(Protocol.LOAD_AVATARS);
                this._monitorSocket.remove(Protocol.PRELOAD_CATEGORY);
                this._monitorSocket.remove(Protocol.REMOVE_PLAYER);
                this._monitorSocket.remove(Protocol.CLEAR_CACHE);
                this._game.configure(config);
            }).then(stateResolve).catch(stateReject);
        });
    }

    nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientSockets, this._monitorSocket);
    }

    errorState(err) {
        return this;
    }
}

export default ConfigureState;