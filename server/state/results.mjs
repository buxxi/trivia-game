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
            await this._monitorSocket.send(Protocol.GAME_END, { history: this._game.session().history(), players: this._game.players() }); 
            resolve();                     
		});
	}

	nextState() {
        return false;
	}

    errorState(error) {
        return false;
    }
}

export default ResultsState;