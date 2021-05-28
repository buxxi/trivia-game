import WaitForAnswersState from './waitforanswers.mjs';
import QuestionErrorState from './questionerror.mjs';
import {Protocol} from '../../js/protocol.mjs';

class PresentQuestionState {
    constructor(game, categories, clientSockets, monitorSocket, question) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
        this._question = question;
    }

	run() {
		return new Promise(async (resolve, reject) => {
            await this._monitorSocket.send(Protocol.SHOW_QUESTION, this._question.text);
            resolve();
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