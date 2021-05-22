const WebSocket = require('ws');
const {PromisifiedWebSocket, Protocol} = require('../js/protocol');

const socket = new WebSocket('ws://localhost:5555');

socket.on('open', () => {
	const psocket = new PromisifiedWebSocket(socket);

	psocket.send(Protocol.JOIN_MONITOR, { gameid: 123 }).then((response) => {
		console.log("Got response #1: " + response);
	}).catch(e => {
		console.log("Error #1: " + e);
	});
});