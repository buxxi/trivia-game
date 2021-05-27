	import server from './server.mjs';
import Game from './game.mjs';
import Categories from './categories.mjs';
import GameLoop from './loop.mjs';
import {PromisifiedWebSocket, Protocol} from '../js/protocol.mjs';
import {v4 as uuid} from 'uuid';

async function init() {
	let categories = new Categories();
	await categories.init();

	server.addWebSocketConnectionListener(socket => {
		const psocket = new PromisifiedWebSocket(socket, uuid);

		psocket.once(Protocol.JOIN_MONITOR, 5000).then(gameId => {
			let game = new Game(categories);
			if (!gameId) {
				gameId = uuid();
			}
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					game.addPlayer(uuid(), "Test player", "horse");
					psocket.send(Protocol.PLAYERS_CHANGED, game.players());
				}, 3000);

				let loop = new GameLoop(game, categories, psocket);
				loop.run();

				resolve(gameId);
			});
		});
	});
}

init();