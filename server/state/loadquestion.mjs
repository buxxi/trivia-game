import PresentQuestionState from './presentquestion.mjs'
import QuestionErrorState from './questionerror.mjs';
import ResultsState from './results.mjs';

const JOKE_CHANCE = 0.5;
const MINIMUM_CATEGORIES_COUNT = 6;

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
        let question = await this._game.nextQuestion();
        
        let showCategorySpinner = this._game.showCategorySpinner();
        let spinnerCategories = showCategorySpinner ? this._insertJokes(this._categories.enabled().map(this._toSpinnerCategory)) : [];
        let correct = this._game.session().category();
        let index = this._game.session().index();
        let total = this._game.session().total();

        await this._monitorConnection.categorySelected(spinnerCategories, correct, index, total);

        return question;
	}

	nextState(question) {
        if (!question) {
            return new ResultsState(this._game, this._categories, this._clientConnections, this._monitorConnection);
        }
		return new PresentQuestionState(this._game, this._categories, this._clientConnections, this._monitorConnection, question);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientConnections, this._monitorConnection, error);
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