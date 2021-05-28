import ConfigureState from "./configure.mjs";
import {Protocol} from '../../js/protocol.mjs';

class ResultsState {
    constructor(game, categories, clientSockets, monitorSocket) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
    }

	run() {
		return new Promise(async (resolve, reject) => {
            await this._monitorSocket.send(Protocol.GAME_END, {});                        
		});
	}

	nextState() {
        return new ConfigureState(this._game, this._categories, this._clientSockets, this._monitorSocket);
	}

    errorState(error) {
        return this;
    }
}

export default ResultsState;