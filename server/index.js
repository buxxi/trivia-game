const server = require('./server');
const Game = require('./game');
const Categories = require('./categories');
const {PromisifiedWebSocket, Protocol} = require('../js/protocol');

server.addWebSocketConnectionListener(socket => {
	const psocket = new PromisifiedWebSocket(socket);

	psocket.once(Protocol.JOIN_MONITOR).then(data => {
		return new Promise((resolve, reject) => {
			resolve("Welcome");
		});
	});
});