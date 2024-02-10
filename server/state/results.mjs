class ResultsState {
    constructor() {}

	async run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        await monitorConnection.results(game.history(), game.players()); 

        await Promise.all(Object.values(clientConnections).map((client) => {
            return client.gameEnd();
        }));

        monitorConnection.close();
        
        Object.values(clientConnections).forEach((client) => {
            client.close();
        });

        stats.save();
	}

	nextState() {
        return false;
	}

    errorState(error) {
        return false;
    }
}

export default ResultsState;