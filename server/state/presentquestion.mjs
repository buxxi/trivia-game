import WaitForAnswersState from './waitforanswers.mjs';

class PresentQuestionState {
    constructor(game, categories, clientSockets, monitorSocket, question) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
        this._question = question;
    }

	run() {
		return new Promise((resolve, reject) => {
			console.log(this._question.text);
            //TODO: communicate the current question and wait for answer
            setTimeout(resolve, 2000);
		});
	}

	nextState() {
		return new WaitForAnswersState(this._game, this._categories, this._clientSockets, this._monitorSocket, this._question);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientSockets, this._monitorSocket, error);
    }
}

export default PresentQuestionState;