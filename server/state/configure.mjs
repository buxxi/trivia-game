import LoadingNextQuestionState from './loadquestion.mjs';
import logger from "../logger.mjs";

const PING_INTERVAL = 10000;

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
                    monitorConnection.preloadProgress(category, current, total).catch(e => { logger.error("Preload progress failed")}); //TODO: better error handling somehow
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

            let pingInterval = this._pingClients(clientConnections, monitorConnection);
    
            monitorConnection.onStartGame().then(async (config) => {
                monitorConnection.clearSetupListeners();
                game.start(config);
                stats.start(game);
            }).then(stateResolve).catch(stateReject).finally(() => clearInterval(pingInterval));
        });
    }

    nextState() {
        return new LoadingNextQuestionState();
    }

    errorState(err) {
        return this;
    }

    _pingClients(clientConnections, monitorConnection) {
        let interval = setInterval(async () => {
            try {
                let pings = Object.fromEntries(await Promise.all(
                    Object.entries(clientConnections).map(([id, client]) => this._pingClient(id, client)))
                );
                await monitorConnection.ping(pings);
            } catch (e) {
                console.error(e); //Should only be if sending to monitor doesn't work, then that game is not working anyway
                clearInterval(interval);
            }
        }, PING_INTERVAL);
        return interval;
    }

    async _pingClient(id, client) {
        try {
            let ping = await client.ping();
            return [id, ping];
        } catch (e) {
            return [id, 9999];
        }
    }
}

export default ConfigureState;