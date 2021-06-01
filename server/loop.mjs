import ConfigureState from './state/configure.mjs';
import {Protocol} from '../js/protocol.mjs';

class GameLoop {
    constructor(game, id, categories, monitorSocket) {
        this._id = id;
        this._game = game;
        this._monitorSocket = monitorSocket;
        this._clientSockets = {};
        this._state = new ConfigureState(game, categories, this._clientSockets, monitorSocket);
    }
    
    async run() {
        console.log(`Game ${this._id} started`);
        this._monitorSocket.onClose.catch(() => this._disconnectClients());
        while (this._state && this._monitorSocket.connected()) {
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

    addClient(socket, clientId, userName, preferredAvatar) {
        if (clientId in this._clientSockets) {
            throw new Error(`${clientId} is already connected`);
        }
        if (clientId in this._game.players()) {
            console.log(`Game ${this._id} - ${clientId} has reconnected`);
        } else {
            this._game.addPlayer(clientId, userName, preferredAvatar);
            console.log(`Game ${this._id} - ${clientId} has joined`);
        }

        this._clientSockets[clientId] = socket;
        socket.onClose.catch(() => {
            delete this._clientSockets[clientId];
            this._sendPlayerChanges()
        });
        this._sendPlayerChanges();
        return this._game.stats(clientId);
    }
    
    _disconnectClients() {
        for (let clientId in this._clientSockets) {
            this._clientSockets[clientId].close();
            delete this._clientSockets[clientId];
        }
    }

    _sendPlayerChanges() {
        if (!this._monitorSocket.connected()) {
            return;
        }
        let players = this._game.players();
        let result = {};
        for (let clientId in players) {
            if (clientId in this._clientSockets) {
                result[clientId] = players[clientId];
            }
        } 

        this._monitorSocket.send(Protocol.PLAYERS_CHANGED, result);   
    }
}

export default GameLoop;