import WaitForAnswersState from './waitforanswers.mjs';
import QuestionErrorState from './questionerror.mjs';

class PresentQuestionState {
    constructor(game, categories, clientConnections, monitorConnection, question) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
        this._question = question;
    }

	async run() {
        let ttsId = this._question.tts ? this._question.tts.question : null;
        await this._monitorConnection.showQuestion(this._question.text, ttsId);
	}

	nextState() {
		return new WaitForAnswersState(this._game, this._categories, this._clientConnections, this._monitorConnection, this._question);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientConnections, this._monitorConnection, error);
    }
}

export default PresentQuestionState;