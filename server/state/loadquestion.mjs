import PresentCategoryState from './presentcategory.mjs';
import QuestionErrorState from './questionerror.mjs';
import ResultsState from './results.mjs';


class LoadingNextQuestionState {
    constructor() {}

	async run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        if (!game.hasMoreQuestions()) {
            return;
        }
        let question = await game.nextQuestion();
        if (game.config().sound.text2Speech) {
            question.tts = {
                category : text2Speech.load(question.category.name), //TODO: full name
                question : text2Speech.load(question.text)
            }
        }
        return question;
	}

	nextState(question) {
        if (!question) {
            return new ResultsState();
        }
		return new PresentCategoryState(question);
	}

    errorState(error) {
        return new QuestionErrorState(error);
    }
}

export default LoadingNextQuestionState;