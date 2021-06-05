import ShowCorrectAnswerState from './showcorrectanswer.mjs';
import QuestionErrorState from './questionerror.mjs';

class WaitForAnswersState {
    constructor(game, categories, clientConnections, monitorConnection, question) {
        this._game = game;
        this._categories = categories;
        this._monitorConnection = monitorConnection;
        this._clientConnections = clientConnections;
        this._question = question;
    }

	async run() {
        await Promise.all(Object.values(this._clientConnections).map(client => client.questionStart(this._question.answers)));
        await this._monitorConnection.questionStart(this._question.view, this._question.answers);
       
        for (let clientId in this._clientConnections) {
            let client = this._clientConnections[clientId];
            client.onGuess().then(async guess => {
                this._game.guess(clientId, guess);
                this._monitorConnection.playerGuessed(clientId);
            });
        };
        
        console.log(this._question.answers);

        let pointsThisRound = await this._game.startTimer((timeLeft, percentageLeft, currentScore) => { 
            return this._monitorConnection.timerTick(timeLeft, percentageLeft, currentScore);
        });  

        Object.values(this._clientConnections).forEach(client => client.removeGuessListener());

        return pointsThisRound;
	}

	nextState(pointsThisRound) {
		return new ShowCorrectAnswerState(this._game, this._categories, this._clientConnections, this._monitorConnection, pointsThisRound);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientConnections, this._monitorConnection, error);
    }
}

export default WaitForAnswersState;