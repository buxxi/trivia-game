import server from './server.mjs';
import Game from './game.mjs';
import Categories from './categories.mjs';
import {PromisifiedWebSocket, Protocol} from '../js/protocol.js';

server.addWebSocketConnectionListener(socket => {
	const psocket = new PromisifiedWebSocket(socket);

	psocket.once(Protocol.JOIN_MONITOR).then(data => {
		return new Promise((resolve, reject) => {
			resolve("Welcome");
		});
	});
});