import ConfigureState from './state/configure.mjs';

class GameLoop {
    constructor(game, id, categories, monitorConnection) {
        this._id = id;
        this._game = game;
        this._monitorConnection = monitorConnection;
        this._clientConnections = {};
        this._state = new ConfigureState(game, categories, this._clientConnections, monitorConnection);
    }
    
    async run() {
        console.log(`Game ${this._id} started`);
        this._monitorConnection.onClose().catch(() => this._disconnectClients());
        while (this._state && this._monitorConnection.connected()) {
            try {
                console.log(`Game ${this._id} - Starting state: ${this._state.constructor.name}`);
                let result = await this._state.run();
                console.log(`Game ${this._id} - Finished state: ${this._state.constructor.name}`);
                this._state = this._state.nextState(result);
            } catch (e) {
                this._state = this._state.errorState(e);
            }
        }
        console.log(`Game ${this._id} ended`);
    }

    addClient(connection, clientId, userName, preferredAvatar) {
        if (clientId in this._clientConnections) {
            throw new Error(`${clientId} is already connected`);
        }
        if (clientId in this._game.players()) {
            console.log(`Game ${this._id} - ${clientId} has reconnected`);
        } else {
            this._game.addPlayer(clientId, userName, preferredAvatar);
            console.log(`Game ${this._id} - ${clientId} has joined`);
        }

        this._clientConnections[clientId] = connection;
        connection.onClose().catch(() => {
            console.log(`Game ${this._id} - ${clientId} has disconnected`);
            delete this._clientConnections[clientId];
            this._sendPlayerChanges();
            try { this._game.removePlayer(clientId) } catch (e) {};
        });
        this._sendPlayerChanges();
        return this._game.stats(clientId);
    }
    
    _disconnectClients() {
        for (let clientId in this._clientConnections) {
            this._clientConnections[clientId].close();
            delete this._clientConnections[clientId];
        }
    }

    _sendPlayerChanges() {
        if (!this._monitorConnection.connected()) {
            return;
        }
        let players = this._game.players();
        let result = {};
        for (let clientId in players) {
            if (clientId in this._clientConnections) {
                result[clientId] = players[clientId];
            }
        } 

        this._monitorConnection.playersChanged(result);
    }
}

export default GameLoop;