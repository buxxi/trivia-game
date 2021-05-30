import { promises as fs } from 'fs';
import TriviaServer from './server.mjs';
import Game from './game.mjs';
import Categories from './categories.mjs';
import GameLoop from './loop.mjs';
import {PromisifiedWebSocket, Protocol} from '../js/protocol.mjs';
import {v4 as uuid} from 'uuid';

function loadConfig() {
	return fs.readFile('conf/config.json');
}

async function init() {
	let config = JSON.parse(await loadConfig());
	let categories = new Categories(config);
	await categories.init();

	let server = new TriviaServer(5555, config.avatars);
	server.start();

	server.addWebSocketConnectionListener(socket => {
		const psocket = new PromisifiedWebSocket(socket, uuid);

		psocket.once(Protocol.JOIN_MONITOR, 5000).then(gameId => {
			let game = new Game(categories, config.avatars);
			if (!gameId) {
				gameId = uuid();
			}
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					game.addPlayer(uuid(), "Test player", "horse");
					//game.addPlayer(uuid(), "Another tester", "mouse");
					psocket.send(Protocol.PLAYERS_CHANGED, game.players());
				}, 3000);

				console.log("Game " + gameId + " started");
				let loop = new GameLoop(game, gameId, categories, psocket);
				loop.run().then(() => {
					console.log("Game " + gameId + " ended");
				});

				resolve(gameId);
			});
		});

		psocket.once(Protocol.JOIN_CLIENT, 5000).then(data => {
			return Promise.resolve();
		});
	});
}

init();