class ResultsState {
    constructor() {}

	async run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        await monitorConnection.results(game.history(), game.players().map(p => new PlayerResult(p))); 

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

class PlayerResult {
    constructor(player) {
		this.name = player.name;
		this.color = player.color;
		this.avatar = player.avatar;
		this.score = player.score;
		this.correct = player.correctGuesses();
		this.wrong = player.wrongGuesses();
		this.fastest = player.fastestCorrectGuess();
		this.slowest = player.slowestCorrectGuess();
		this.mostWon = player.mostPointsWon();
		this.mostLost = player.mostPointsLost();
    }
}

export default ResultsState;