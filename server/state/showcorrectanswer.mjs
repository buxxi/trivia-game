import LoadingNextQuestionState from './loadquestion.mjs';
import QuestionErrorState from './questionerror.mjs';

class ShowCorrectAnswerState {
    constructor(game, categories, clientConnections, monitorConnection, pointsThisRound) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
        this._pointsThisRound = pointsThisRound;
    }

	async run() {
        let correct = this._game.correctAnswer();
        console.log(correct);

        await Promise.all(Object.keys(this._clientConnections).map(clientId => {
            this._clientConnections[clientId].questionEnd(this._pointsThisRound[clientId], correct);
        }));
        await this._monitorConnection.questionEnd(this._pointsThisRound, correct);
	}

	nextState() {
        return new LoadingNextQuestionState(this._game, this._categories, this._clientConnections, this._monitorConnection);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientConnections, this._monitorConnection, error);
    }
}

export default ShowCorrectAnswerState;