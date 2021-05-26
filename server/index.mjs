import server from './server.mjs';
import avatars from './avatars.mjs';
import Game from './game.mjs';
import Categories from './categories.mjs';
import {PromisifiedWebSocket, Protocol} from '../js/protocol.mjs';
import {v4 as uuid} from 'uuid';

async function init() {
	let categories = new Categories();
	let game = new Game(categories);
	await categories.init();

	server.addWebSocketConnectionListener(socket => {
		const psocket = new PromisifiedWebSocket(socket, uuid);
	
		psocket.once(Protocol.JOIN_MONITOR).then(gameId => {
			if (!gameId) {
				gameId = uuid();
			}
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					game.addPlayer(uuid(), "Test player", "horse");
					psocket.send(Protocol.PLAYERS_CHANGED, game.players());
				}, 3000);
				resolve(gameId);
			});
		});
	
		psocket.on(Protocol.LOAD_CATEGORIES).then(() => {
			return new Promise((resolve, reject) => {
				resolve(categories.available());
			});		
		});

		psocket.on(Protocol.LOAD_AVATARS).then(() => {
			return new Promise((resolve, reject) => {
				resolve(avatars);
			});		
		});

		psocket.on(Protocol.PRELOAD_CATEGORY).then(category => {
			return new Promise((resolve, reject) => {
				categories.preload(category, (current, total) => {
					psocket.send(Protocol.PRELOAD_CATEGORY_PROGRESS(category), { current: current, total: total });
				}, game).then((count) => {
					resolve(count);
				}).catch(reject);
			});	
		});

		psocket.on(Protocol.REMOVE_PLATER).then(playerId => {
			return new Promise((resolve, reject) => {
				game.removePlayer(playerId);
				resolve(true);
			});
		});

		psocket.on(Protocol.CLEAR_CACHE).then(() => {
			return new Promise((resolve, reject) => {
				categories.clearCache();
				resolve(true);
			});
		});

		psocket.on(Protocol.START_GAME).then((config) => {
			return new Promise((resolve, reject) => {
				reject(new Error("Not implemented yet!"));
			});
		});
	});
}

init();
