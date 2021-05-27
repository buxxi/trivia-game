import PresentQuestionState from './presentquestion.mjs'
import QuestionErrorState from './questionerror.mjs';
import ResultsState from './results.mjs';

class LoadingNextQuestionState {
    constructor(game, categories, clientSockets, monitorSocket) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
    }

	run() {
		return new Promise(async (resolve, reject) => {
            if (!this._game.hasMoreQuestions()) {
                return resolve();
            }
            try {
                let question = await this._game.nextQuestion();
                //TODO: communicate category to spinner
                
                setTimeout(() => resolve(question), 2000);
            } catch (e) {
                reject(e);
            }
		});
	}

	nextState(question) {
        if (!question) {
            return new ResultsState(this._game, this._categories, this._clientSockets, this._monitorSocket);
        }
		return new PresentQuestionState(this._game, this._categories, this._clientSockets, this._monitorSocket, question);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientSockets, this._monitorSocket, error);
    }
}

export default LoadingNextQuestionState;