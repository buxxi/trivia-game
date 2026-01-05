import LoadingNextQuestionState from './loadquestion.mjs';

class ConfigureState {
    constructor() {}

    run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        return new Promise((stateResolve, stateReject) => {
            monitorConnection.onChangeLanguage().then(async (language) => {
                game.config().language = language;
            });

            monitorConnection.onLoadCategories().then(async () => {
                return categories.available(game);
            });
    
            monitorConnection.onPreloadCategory().then(async (category) => {
                let count = await categories.preload(category, game, (current, total) => {
                    monitorConnection.preloadProgress(category, current, total).catch(e => { console.log("Preload progress failed")}); //TODO: better error handling somehow
                });
                return count;
            });
    
            monitorConnection.onRemovePlayer().then(async (playerId) => {
                game.removePlayer(playerId);
                clientConnections[playerId].close();
            });
    
            monitorConnection.onClearCache().then(async (category) => {
                categories.clearCache(category);
            });

            let pingInterval = setInterval(() => this._pingClients(clientConnections, monitorConnection), 10000);
    
            monitorConnection.onStartGame().then(async (config) => {
                clearInterval(pingInterval);
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

    async _pingClients(clientConnections, monitorConnection) {
        try {
            let pings = Object.fromEntries(await Promise.all(Object.entries(clientConnections).map(([id, client]) => client.ping().then((ping) => [id, ping]))));
            await monitorConnection.ping(pings);
        } catch (e) {
            console.error(e);
        }
    }
}

export default ConfigureState;