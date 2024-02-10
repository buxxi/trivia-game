import LoadingNextQuestionState from "./loadquestion.mjs";

class QuestionErrorState {
    constructor(error) {
        this._error = error;
    }

	async run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        console.log(this._error);

        monitorConnection.questionError(this._error.message);

        let clients = Object.values(clientConnections);
        let pings = await Promise.all(clients.map(client => client.ping().catch(err => -1 )));
    
        console.log("Player pings: " + pings);

        if (pings.includes(-1)) {
            this._disconnectHangedClients(pings, clients);
            monitorConnection.questionError("Some player(s) has lost their connection, waiting a minute before automatically continuing");
            await this._wait(60000);
        } else {
            await this._wait(3000);
        }
        
	}

	nextState() {
        return new LoadingNextQuestionState();
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