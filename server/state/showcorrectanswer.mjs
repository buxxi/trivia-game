import LoadingNextQuestionState from './loadquestion.mjs';
import QuestionErrorState from './questionerror.mjs';
import {Protocol} from '../../js/protocol.mjs';

class ShowCorrectAnswerState {
    constructor(game, categories, clientSockets, monitorSocket, pointsThisRound) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
        this._pointsThisRound = pointsThisRound;
    }

	async run() {
        let correct = this._game.correctAnswer();
        console.log(correct);

        await this._monitorSocket.send(Protocol.QUESTION_END, { pointsThisRound: this._pointsThisRound, correct: correct });

        //TODO: send correct answer to client and their points 
	}

	nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientSockets, this._monitorSocket);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientSockets, this._monitorSocket, error);
    }
}

export default ShowCorrectAnswerState;