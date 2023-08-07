import {Command, Option} from 'commander';
import ClientToServerConnection from './client/js/connection.mjs';
import ws from 'ws';
import {v4 as uuidv4} from 'uuid';

global.WebSocket = ws;
const program = new Command();

program.version('0.0.1')
    .addOption(new Option('-n, --count <count>', 'The number of bots to add').default(1))
    .addOption(new Option('-g, --gameid <id>', 'The id of the game').makeOptionMandatory())
    .addOption(new Option('-u, --url <url>', 'The url to the service').makeOptionMandatory())
    .addOption(new Option('-b, --behaviours <behaviours...>', 'The behaviour each bot use').default(['guess']).choices(['guess', 'reconnect']))
    .parse();


class Bot {
    constructor(name, connection, gameId, behaviours) {
        this._name = name;
        this._connection = connection;
        this._gameId = gameId;
        this._behaviours = behaviours;
        this._gameStarted = false;
    }

    async init() {
        let result = await this._connection.connect(this._gameId, this._name);
        this._clientId = result.clientId;
        this._listen();
        if (this._behaviours.includes('reconnect')) {
            setTimeout(() => this._reconnect(), this._randomDelay() * 2);
        }
    }

    _listen() {
        this._connection.onQuestionStart().then(async () => {
            this._gameStarted = true;
            this._guess();
        });
        this._connection.onQuestionEnd().then(async () => {});
        this._connection.onGameEnd().then(async () => {});
    }

    async _reconnect() {
        try {
            if (this._connection.connected()) {
                this._connection.close();
                console.log(`${this._name} disconnected`);
            } else {
                if (this._gameStarted) {
                    await this._connection.reconnect(this._gameId, this._clientId);
                } else {
                    let result = await this._connection.connect(this._gameId, this._name);
                    this._clientId = result.clientId;
                }
                console.log(`${this._name} connected`);
                this._listen();   
            }
        } catch (e) {
            console.log(`${this._name} failed to reconnect: ${e.message}`);
        }
        setTimeout(() => this._reconnect(), this._randomDelay() * 2);
    }

    _guess() {
        if (!this._behaviours.includes('guess')) {
            return;
        }

        setTimeout(() => {
            let guess = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
            this._connection.guess(guess).then(() => console.log(`${this._name} guessed ${guess}`)).catch((e) => {});
        }, this._randomDelay());
    }

    _randomDelay() {
        return Math.floor(Math.random() * 10000);
    }
}

    

async function createBots(count, gameId, url, behaviours) {
    for (var i = 0; i < count; i++) {
        let conn = new ClientToServerConnection(url, uuidv4);
        let bot = new Bot(`Bot ${i + 1}`, conn, gameId, behaviours);
        await bot.init();
    }
}

let opts = program.opts();

createBots(opts.count, opts.gameid, opts.url, opts.behaviours);
