import LoadingNextQuestionState from './loadquestion.mjs';
import QuestionErrorState from './questionerror.mjs';

class ShowCorrectAnswerState {
    constructor(pointsThisRound) {
        this._pointsThisRound = pointsThisRound;
    }

	async run(game, categories, clientConnections, monitorConnection, text2Speech) {
        let correct = game.correctAnswer();
        console.log(correct);

        await Promise.all(Object.keys(clientConnections).map(clientId => {
            return clientConnections[clientId].questionEnd(this._pointsThisRound[clientId], correct);
        }));
        await monitorConnection.questionEnd(this._pointsThisRound, correct);
	}

	nextState() {
        return new LoadingNextQuestionState();
	}

    errorState(error) {
        return new QuestionErrorState(error);
    }
}

export default ShowCorrectAnswerState;