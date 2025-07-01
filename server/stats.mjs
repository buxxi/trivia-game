import fs from "fs/promises";
import {statsPath} from "./xdg.mjs";

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
            config: game.config(),
            started: new Date().toISOString()
        });
    }

    questionEnd(game) {
        if (!game.config().saveStatistics) {
            return;
        }
        Object.assign(this.data, {
            ended: new Date().toISOString(),
            questions: this._createQuestions(game.history(), game.players()),
            players: this._createPlayers(game.players())
        });
    }

    async save(game) {
        if (!game.config().saveStatistics) {
            return;
        }
        let statsFile = statsPath(`${this.data.started.replaceAll(/[^0-9a-z]/g, '')}_${this.data.uuid}.json`);
		await fs.writeFile(statsFile, JSON.stringify(this.data));
    }

    _createPlayers(players) {
        return Object.entries(players).reduce((result, entry) => {
            result[entry[0]] = {
                name : entry[1].name,
                avatar : entry[1].avatar,
                points: entry[1].score,
                place: Object.values(players).filter(p => p.score > entry[1].score).length + 1
            };
            return result;
        }, {});
    }

    _createQuestions(history, players) {
        return history.map((question, i) => {
            return ({
                category: question.category.type,
                question: question.text,
                answers: question.answers,
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