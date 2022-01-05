import LoadingNextQuestionState from "./loadquestion.mjs";

class QuestionErrorState {
    constructor(game, categories, clientConnections, monitorConnection, error) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
        this._error = error;
    }

	async run() {
        console.log(this._error);

        this._monitorConnection.questionError(this._error.message);

        let clients = Object.values(this._clientConnections);
        let pings = await Promise.all(clients.map(client => client.ping().catch(err => -1 )));
    
        console.log("Player pings: " + pings);

        if (pings.includes(-1)) {
            this._disconnectHangedClients(pings, clients);
            this._monitorConnection.questionError("Some player(s) has lost their connection, waiting a minute before automatically continuing");
            await this._wait(60000);
        } else {
            await this._wait(3000);
        }
        
	}

	nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientConnections, this._monitorConnection);
	}

    errorState(error) {
        return this;
    }

    _wait(ms) {
        return new Promise((resolve, reject) => setTimeout(resolve, ms));
    }

    _disconnectHangedClients(pings, clients) {
        for (var i = 0; i < pings.length; i++) {
            if (pings[i] == -1) {
                clients[i].close();
            }
        }
    }
} 

export default QuestionErrorState;