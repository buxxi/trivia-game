import LoadingNextQuestionState from './loadquestion.mjs';

class ConfigureState {
    constructor(game, categories, clientConnections, monitorConnection) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
    }

    run() {
        return new Promise((stateResolve, stateReject) => {
            this._monitorConnection.onLoadCategories().then(async () => {
                return this._categories.available();	
            });
    
            this._monitorConnection.onPreloadCategory().then(async (category) => {
                let count = await this._categories.preload(category, (current, total) => {
                    this._monitorConnection.preloadProgress(category, current, total);
                }, this._game);
                return count;
            });
    
            this._monitorConnection.onRemovePlayer().then(async (playerId) => {
                this._game.removePlayer(playerId);
            });
    
            this._monitorConnection.onClearCache().then(async () => {
                this._categories.clearCache();
            });
    
            this._monitorConnection.onStartGame().then(async (config) => {
                this._monitorConnection.clearSetupListeners();
                this._game.start(config);
            }).then(stateResolve).catch(stateReject);
        });
    }

    nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientConnections, this._monitorConnection);
    }

    errorState(err) {
        return this;
    }
}

export default ConfigureState;