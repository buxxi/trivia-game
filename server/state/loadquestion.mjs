import PresentCategoryState from './presentcategory.mjs';
import QuestionErrorState from './questionerror.mjs';
import ResultsState from './results.mjs';


//TODO: move all the common constructor parameters to run() instead
class LoadingNextQuestionState {
    constructor(game, categories, clientConnections, monitorConnection) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
    }

	async run(textToSpeech) {
        if (!this._game.hasMoreQuestions()) {
            return;
        }
        let question = await this._game.nextQuestion();
        if (this._game.config().sound.text2Speech) {
            question.tts = {
                category : textToSpeech.load(question.category.name), //TODO: full name
                question : textToSpeech.load(question.text)
            }
        }
        return question;
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