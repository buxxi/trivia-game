const server = require('./server');
const Categories = require('./categories');
const {PromisifiedWebSocket, Protocol} = require('../js/protocol');

const categories = new Categories();

server.addWebSocketConnectionListener(socket => {
	const psocket = new PromisifiedWebSocket(socket);

	psocket.once(Protocol.JOIN_MONITOR).then(data => {
		return new Promise((resolve, reject) => {
			resolve("Welcome");
		});
	});
});