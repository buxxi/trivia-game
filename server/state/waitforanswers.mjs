import ShowCorrectAnswerState from './showcorrectanswer.mjs';

class WaitForAnswersState {
    constructor(game, categories, clientSockets, monitorSocket, question) {
        this._game = game;
        this._categories = categories;
        this._monitorSocket = monitorSocket;
        this._clientSockets = clientSockets;
        this._question = question;
    }

	run() {
		return new Promise(async (resolve, reject) => {
            try {
                //TODO: send answers to monitor and clients
                //TODO: wait for player to load
                
                console.log(this._question.answers);

				let pointsThisRound = await this._game.startTimer((timer) => { console.log("timer tick tock..."); /*TODO: callback for each timer tick?*/ });

				resolve(pointsThisRound);
			} catch (e) {
				reject(e);
			} finally {
                //TODO: tell player to stop
            }
		});
	}

	nextState(pointsThisRound) {
		return new ShowCorrectAnswerState(this._game, this._categories, this._clientSockets, this._monitorSocket, pointsThisRound);
	}

    errorState(error) {
        return new QuestionErrorState(this._game, this._categories, this._clientSockets, this._monitorSocket, error);
    }
}

export default WaitForAnswersState;