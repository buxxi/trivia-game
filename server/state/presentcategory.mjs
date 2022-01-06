import PresentQuestionState from './presentquestion.mjs';
import QuestionErrorState from './questionerror.mjs';

const JOKE_CHANCE = 0.5;
const MINIMUM_CATEGORIES_COUNT = 8;

class PresentCategoryState {
    constructor(game, categories, clientConnections, monitorConnection, question) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
        this._question = question;
    }

	async run() {
        let showCategorySpinner = this._game.showCategorySpinner();
        let spinnerCategories = showCategorySpinner ? this._insertJokes(this._categories.enabled(this._game).map(this._toSpinnerCategory)) : [];
        let correct = this._game.currentCategory();
        let index = this._game.currentQuestionIndex();
        let total = this._game.totalQuestionCount();

        await this._monitorConnection.categorySelected(spinnerCategories, correct, index, total);
	}

	nextState() {
		return new PresentQuestionState(this._game, this._categories, this._clientConnections, this._monitorConnection, this._question);
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

export default PresentCategoryState;