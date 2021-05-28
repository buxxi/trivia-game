import PresentQuestionState from './presentquestion.mjs'
import QuestionErrorState from './questionerror.mjs';
import ResultsState from './results.mjs';
import {Protocol} from '../../js/protocol.mjs';

const JOKE_CHANCE = 0.5;
const MINIMUM_CATEGORIES_COUNT = 6;

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
                
                let spinnerCategories = this._insertJokes(this._categories.enabled().map(this._toSpinnerCategory));
                let correct = this._game.session().category();
                let index = this._game.session().index();
                let total = this._game.session().total();

                await this._monitorSocket.send(Protocol.SHOW_CATEGORY_SELECT, {
                    categories: spinnerCategories,
                    correct: correct,
                    index: index,
                    total: total  
                });

                resolve(question);
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

    _insertJokes(categories) {
        var result = [];
        var insertJoke = Math.random() >= JOKE_CHANCE;
		while (result.length < MINIMUM_CATEGORIES_COUNT || insertJoke) {
			if (insertJoke) {
				result.push(this._toSpinnerCategory(this._categories.joke()));
			}
			result = result.concat(categories); //TODO: shuffle this array?
			insertJoke = Math.random() >= JOKE_CHANCE;
		}
        return result;
    }

    _toSpinnerCategory(c) {
        return ({ name: c.name, icon: c.icon, fullName: c.name });
    }
}

export default LoadingNextQuestionState;