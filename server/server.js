const express = require('express');
const ws = require('ws');
const app = express();
const port = 5555;

//Init regular web server
const server = app.listen(port, () => {
	console.log(`Listening on ${port}!`)
});

//Init websocket server
const wsServer = new ws.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
	wsServer.handleUpgrade(request, socket, head, socket => {
		wsServer.emit('connection', socket, request);
	});
});

module.exports = {
    addWebSocketConnectionListener: function(listener) {
        wsServer.on('connection', listener);    
    }
};