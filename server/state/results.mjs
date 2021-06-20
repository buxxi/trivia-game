class ResultsState {
    constructor(game, categories, clientConnections, monitorConnection) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
    }

	async run() {
        await this._monitorConnection.results(this._game.session().history(), this._game.players()); 

        await Promise.all(Object.values(this._clientConnections).map((client) => {
            return client.gameEnd();
        }));

        this._monitorConnection.close();
        
        Object.values(this._clientConnections).forEach((client) => {
            client.close();
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