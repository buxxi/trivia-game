import PresentQuestionState from './presentquestion.mjs';
import QuestionErrorState from './questionerror.mjs';
import Random from '../random.mjs';

const JOKE_CHANCE = 0.5;
const MINIMUM_CATEGORIES_COUNT = 8;

class PresentCategoryState {
    constructor(question) {
        this._question = question;
    }

	async run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        let showCategorySpinner = game.showCategorySpinner();
        let spinnerCategories = showCategorySpinner ? this._makeCategoryList(categories, game) : [];
        let correct = game.currentCategory();
        let index = game.currentQuestionIndex();
        let total = game.totalQuestionCount();
        let ttsId = this._question.tts ? this._question.tts.category : null;

        await monitorConnection.categorySelected(spinnerCategories, correct, index, total, ttsId);
	}

	nextState() {
		return new PresentQuestionState(this._question);
	}

    errorState(error) {
        return new QuestionErrorState(error);
    }

    _makeCategoryList(categories, game) {
        let enabledCategories = categories.enabled(game).map(this._toSpinnerCategory);
        var result = [];
        var insertJoke = Math.random() >= JOKE_CHANCE;
		while (result.length < MINIMUM_CATEGORIES_COUNT || insertJoke) {
			if (insertJoke) {
				result.push(this._toSpinnerCategory(categories.joke(game.players())));
			}
			result = result.concat(enabledCategories);
			insertJoke = Math.random() >= JOKE_CHANCE;
		}
        return this._shuffle(result);
    }

    _toSpinnerCategory(c) {
        return ({ name: c.name, icon: c.icon, fullName: c.name });
    }

    _shuffle(input) {
        let result = [];
        while (input.length > 0) {
            result.push(input.splice(Random.random(input.length), 1)[0]);
        }
        return result;
    }
}

export default PresentCategoryState;