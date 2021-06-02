class ResultsState {
    constructor(game, categories, clientConnections, monitorConnection) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
    }

	async run() {
        await this._monitorConnection.results(this._game.session().history(), this._game.players()); 
	}

	nextState() {
        return false;
	}

    errorState(error) {
        return false;
    }
}

export default ResultsState;