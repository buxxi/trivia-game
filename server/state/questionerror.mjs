import LoadingNextQuestionState from "./loadquestion.mjs";

class QuestionErrorState {
    constructor(game, categories, clientSockets, monitorSocket, error) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
        this._error = error;
    }

	run() {
		return new Promise((resolve, reject) => {
			console.log(this._error);

            //TODO: communicate error to monitor

			setTimeout(() => {
				resolve();
			}, 3000);
		});
	}

	nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientSockets, this._monitorSocket);
	}

    errorState(error) {
        return this;
    }
}

export default QuestionErrorState;