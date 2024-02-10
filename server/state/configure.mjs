import LoadingNextQuestionState from './loadquestion.mjs';

class ConfigureState {
    constructor() {}

    run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        return new Promise((stateResolve, stateReject) => {
            monitorConnection.onLoadCategories().then(async () => {
                return categories.available();	
            });
    
            monitorConnection.onPreloadCategory().then(async (category) => {
                let count = await categories.preload(category, (current, total) => {
                    monitorConnection.preloadProgress(category, current, total).catch(e => { console.log("Preload progress failed")}); //TODO: better error handling somehow
                });
                return count;
            });
    
            monitorConnection.onRemovePlayer().then(async (playerId) => {
                game.removePlayer(playerId);
            });
    
            monitorConnection.onClearCache().then(async () => {
                categories.clearCache();
            });
    
            monitorConnection.onStartGame().then(async (config) => {
                monitorConnection.clearSetupListeners();
                game.start(config);
                stats.start(game);
            }).then(stateResolve).catch(stateReject);
        });
    }

    nextState() {
        return new LoadingNextQuestionState();
    }

    errorState(err) {
        return this;
    }
}

export default ConfigureState;