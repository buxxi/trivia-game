import ShowCorrectAnswerState from './showcorrectanswer.mjs';
import QuestionErrorState from './questionerror.mjs';

class WaitForAnswersState {
    constructor(question) {
        this._question = question;
    }

	async run(game, categories, clientConnections, monitorConnection, text2Speech, stats) {
        await Promise.all(Object.values(clientConnections).map(client => client.questionStart(this._question.answers)));
        await monitorConnection.questionStart(this._question.view, this._question.answers);
       
        for (let clientId in clientConnections) {
            let client = clientConnections[clientId];
            client.onGuess().then(async guess => {
                game.guess(clientId, guess);
                return monitorConnection.playerGuessed(clientId);
            });
        };
        
        console.log(this._question.answers);

        let pointsThisRound = await game.startTimer((timeLeft, percentageLeft, currentScore) => { 
            return monitorConnection.timerTick(timeLeft, percentageLeft, currentScore);
        });  

        Object.values(clientConnections).forEach(client => client.removeGuessListener());

        return pointsThisRound;
	}

	nextState(pointsThisRound) {
		return new ShowCorrectAnswerState(pointsThisRound);
	}

    errorState(error) {
        return new QuestionErrorState(error);
    }
}

export default WaitForAnswersState;