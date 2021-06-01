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

	async run() {
        await Promise.all(Object.values(this._clientSockets).map(socket => socket.send(Protocol.QUESTION_START, this._question.answers, 5000)));
        await this._monitorSocket.send(Protocol.QUESTION_START, { view: this._question.view, answers: this._question.answers });
       
        

        //TODO: listen for guesses
        
        console.log(this._question.answers);

        let pointsThisRound = await this._game.startTimer((timeLeft, percentageLeft, currentScore) => { 
            this._monitorSocket.send(Protocol.TIMER_TICK, {
                timeLeft: timeLeft,
                percentageLeft: percentageLeft,
                currentScore: currentScore
            });
        });

        //TODO: stop listening for guesses

        return pointsThisRound;
	}

	nextState(pointsThisRound) {
		return new ShowCorrectAnswerState(this._game, this._categories, this._clientSockets, this._monitorSocket, pointsThisRound);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientSockets, this._monitorSocket, error);
    }
}

export default WaitForAnswersState;