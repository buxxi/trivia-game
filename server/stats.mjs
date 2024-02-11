import fs from "fs/promises";
import path from "path";

class GameStatistics {
    constructor(path, id) {
        this.path = path;
        this.id = id;
        this.data = {"id" : id};
    }

    start(game) {
        if (!game.config().saveStatistics) {
            return;
        }
        Object.assign(this.data, {
            uuid: crypto.randomUUID(),
            started: new Date().toISOString(),
            players: this._createPlayers(game.players()),
        });
    }

    questionEnd(game) {
        if (!game.config().saveStatistics) {
            return;
        }
        Object.assign(this.data, {
            questions: this._createQuestions(game.history(), game.players())
        });
    }

    async save(game) {
        if (!game.config().saveStatistics) {
            return;
        }
        let statsFile = path.resolve(this.path, `${this.data.started.replaceAll(/[^0-9a-z]/g, '')}_${this.data.uuid}.json`);
		await fs.writeFile(statsFile, JSON.stringify(this.data));
    }

    _createPlayers(players) {
        return Object.entries(players).reduce((result, entry) => {
            result[entry[0]] = {
                name : entry[1].name,
                avatar : entry[1].avatar
            };
            return result;
        }, {});
    }

    _createQuestions(history, players) {
        return history.map((question, i) => {
            return ({
                category: question.category.name,
                question: question.text,
                answers: Object.values(question.answers),
                correct: question.correct,
                guesses: this._createGuesses(players, i)
            });
        });
    }

    _createGuesses(players, questionIndex) {
        return Object.entries(players).reduce((result, entry) => {
            result[entry[0]] = {
                guessed : entry[1].guesses[questionIndex].guessed,
                correct : entry[1].guesses[questionIndex].correct,
                time : entry[1].guesses[questionIndex].time,
                multiplier : entry[1].guesses[questionIndex].multiplier,
                points : entry[1].guesses[questionIndex].points
            };
            return result;
        }, {});        
    }
}

export default GameStatistics;