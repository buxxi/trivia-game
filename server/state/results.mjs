import ConfigureState from "./configure.mjs";

class ResultsState {
    constructor(game, categories, clientSockets, monitorSocket) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
    }

	run() {
		return new Promise((resolve, reject) => {
            //TODO: communicate results to monitor and wait for 
            console.log("And the results are in!");

			setTimeout(() => {
				resolve();
			}, 3000);
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