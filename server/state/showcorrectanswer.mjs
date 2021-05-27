import LoadingNextQuestionState from './loadquestion.mjs';

class ShowCorrectAnswerState {
    constructor(game, categories, clientSockets, monitorSocket, pointsThisRound) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
        this._pointsThisRound = pointsThisRound;
    }

	run() {
		return new Promise((resolve, reject) => {
            //TODO: send points and correct answer to monitor
            //TODO: send correct answer to client and their points
            console.log(this._game.session().question().correct);
			resolve();
		});
	}

	nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientSockets, this._monitorSocket);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientSockets, this._monitorSocket, error);
    }
}

export default ShowCorrectAnswerState;