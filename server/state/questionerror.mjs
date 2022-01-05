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
        
        await this._wait(3000);
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
} 

export default QuestionErrorState;