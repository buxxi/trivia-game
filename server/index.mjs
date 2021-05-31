import { promises as fs } from 'fs';
import TriviaServer from './server.mjs';
import Game from './game.mjs';
import Categories from './categories.mjs';
import GameLoop from './loop.mjs';
import {PromisifiedWebSocket, Protocol} from '../js/protocol.mjs';
import {v4 as uuid} from 'uuid';

class GameRepository {
	constructor(categories, avatars) {
		this._categories = categories;
		this._avatars = avatars;
		this._currentGames = {};
	}

	getGame(gameId) {
		if (!(gameId in this._currentGames)) {
			throw new Error("No game with id: " + gameId);
		}
		return this._currentGames[gameId];
	}

	startGame(gameId, psocket) {
		let game = new Game(this._categories, this._avatars);
		let loop = new GameLoop(game, gameId, this._categories, psocket);
		
		if (gameId in this._currentGames) {
			throw new Error("Game " + gameId + " is already running");
		}
		this._currentGames[gameId] = loop;
		loop.run().finally(() => {
			delete this._currentGames[gameId];
		})

		return gameId;
	}
}

async function loadConfig() {
	console.log("Loading config");
	return JSON.parse(await fs.readFile('conf/config.json'));
}

async function loadCategories(config) {
	console.log("Loading categories");
	let categories = new Categories(config);
	await categories.init();
	return categories;
}

function startServer(config) {
	console.log("Starting server");
	let server = new TriviaServer(5555, config.avatars);
	server.start();
	return server;
}

async function init() {
	let config = await loadConfig();
	let categories = await loadCategories(config);
	let repository = new GameRepository(categories, config.avatars);
	let server = startServer(config);

	server.addWebSocketConnectionListener(socket => {
		const psocket = new PromisifiedWebSocket(socket, uuid);

		let monitorJoin = psocket.once(Protocol.JOIN_MONITOR, 5000).then(async (gameId) => {
			if (!gameId) {
				gameId = uuid();
			}
			repository.startGame(gameId, psocket);
			return gameId;
		});

		let clientJoin = psocket.once(Protocol.JOIN_CLIENT, 5000).then(async (data) => {
			let game = repository.getGame(data.gameId);

		});

		Promise.race([monitorJoin, clientJoin]).catch(e => {
			socket.close();
		});
	});
}

init();