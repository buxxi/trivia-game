import LoadingNextQuestionState from "./loadquestion.mjs";
import {Protocol} from '../../js/protocol.mjs';

class QuestionErrorState {
    constructor(game, categories, clientSockets, monitorSocket, error) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
        this._error = error;
    }

	run() {
		return new Promise(async (resolve, reject) => {
			console.log(this._error);

            await this._monitorSocket.send(Protocol.QUESTION_ERROR, this._error.message);
            resolve();
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