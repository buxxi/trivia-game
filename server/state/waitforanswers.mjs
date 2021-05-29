import ShowCorrectAnswerState from './showcorrectanswer.mjs';
import QuestionErrorState from './questionerror.mjs';
import {Protocol} from '../../js/protocol.mjs';

class WaitForAnswersState {
    constructor(game, categories, clientSockets, monitorSocket, question) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
        this._question = question;
    }

	run() {
		return new Promise(async (resolve, reject) => {
            try {
                await this._monitorSocket.send(Protocol.QUESTION_START, { view: this._question.view, answers: this._question.answers });
                //TODO: send answers to clients
                //TODO: listen for guesses
                
                console.log(this._question.answers);

                let id = Object.keys(this._game.players())[0];
                setTimeout(() => {
                    this._game.guess(id, 'A');
                    this._monitorSocket.send(Protocol.PLAYER_GUESSED, id);
                }, 1000);

				let pointsThisRound = await this._game.startTimer((timer) => { console.log("timer tick tock..."); /*TODO: callback for each timer tick?*/ });

                //TODO: stop listening for guesses

				resolve(pointsThisRound);
			} catch (e) {
				reject(e);
			}
		});
	}

	nextState(pointsThisRound) {
		return new ShowCorrectAnswerState(this._game, this._categories, this._clientSockets, this._monitorSocket, pointsThisRound);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientSockets, this._monitorSocket, error);
    }
}

export default WaitForAnswersState;