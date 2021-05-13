const server = require('./server');

server.addWebSocketConnectionListener(socket => {
	console.log("New connection");
	socket.on('close', () => console.log("Closed connection"));
	socket.close();
});