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

        await this._monitorConnection.questionError(this._error.message);
	}

	nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientConnections, this._monitorConnection);
	}

    errorState(error) {
        return this;
    }
}

export default QuestionErrorState;