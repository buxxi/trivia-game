import WaitForAnswersState from './waitforanswers.mjs';
import QuestionErrorState from './questionerror.mjs';

class PresentQuestionState {
    constructor(question) {
        this._question = question;
    }

	async run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        let ttsId = this._question.tts ? this._question.tts.question : null;
        await monitorConnection.showQuestion(this._question.text, ttsId);
	}

	nextState() {
		return new WaitForAnswersState(this._question);
	}

    errorState(error) {
        return new QuestionErrorState(error);
    }
}

export default PresentQuestionState;