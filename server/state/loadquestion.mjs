import PresentCategoryState from './presentcategory.mjs';
import QuestionErrorState from './questionerror.mjs';
import ResultsState from './results.mjs';

class LoadingNextQuestionState {
    constructor(game, categories, clientConnections, monitorConnection) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
    }

	async run() {
        if (!this._game.hasMoreQuestions()) {
            return;
        }
        return await this._game.nextQuestion();
	}

	nextState(question) {
        if (!question) {
            return new ResultsState(this._game, this._categories, this._clientConnections, this._monitorConnection);
        }
		return new PresentCategoryState(this._game, this._categories, this._clientConnections, this._monitorConnection, question);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientConnections, this._monitorConnection, error);
    }
}

export default LoadingNextQuestionState;