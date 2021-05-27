import avatars from '../avatars.mjs';
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
        return new Promise((stateResolve, reject) => {
            this._monitorSocket.on(Protocol.LOAD_CATEGORIES).then(() => {
                return new Promise((resolve, reject) => {
                    resolve(this._categories.available());
                });		
            });
    
            this._monitorSocket.on(Protocol.LOAD_AVATARS).then(() => {
                return new Promise((resolve, reject) => {
                    resolve(avatars);
                });		
            });
    
            this._monitorSocket.on(Protocol.PRELOAD_CATEGORY).then(category => {
                return new Promise((resolve, reject) => {
                    this._categories.preload(category, (current, total) => {
                        this._monitorSocket.send(Protocol.PRELOAD_CATEGORY_PROGRESS(category), { current: current, total: total });
                    }, this._game).then((count) => {
                        resolve(count);
                    }).catch(reject);
                });	
            });
    
            this._monitorSocket.on(Protocol.REMOVE_PLAYER).then(playerId => {
                return new Promise((resolve, reject) => {
                    this._game.removePlayer(playerId);
                    resolve(true);
                });
            });
    
            this._monitorSocket.on(Protocol.CLEAR_CACHE).then(() => {
                return new Promise((resolve, reject) => {
                    this._categories.clearCache();
                    resolve(true);
                });
            });
    
            this._monitorSocket.on(Protocol.START_GAME).then((config) => {
                return new Promise((resolve, reject) => {
                    this._monitorSocket.remove(Protocol.LOAD_CATEGORIES);
                    this._monitorSocket.remove(Protocol.LOAD_AVATARS);
                    this._monitorSocket.remove(Protocol.PRELOAD_CATEGORY);
                    this._monitorSocket.remove(Protocol.REMOVE_PLAYER);
                    this._monitorSocket.remove(Protocol.CLEAR_CACHE);
                    this._monitorSocket.remove(Protocol.START_GAME);
                    this._game.configure(config);
                    resolve();
                    stateResolve();
                });
            });
        });
    }

    nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientSockets, this._monitorSocket);
    }

    errorState(err) {
        console.log(err);
        return this;
    }
}

export default ConfigureState;