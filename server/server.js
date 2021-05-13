const express = require('express');
const ws = require('ws');
const app = express();
const port = 5555;

//Serve files for client
app.use('/client', express.static('../client'));
app.use('/client/css', express.static('../css'));
app.use('/client/js', express.static('../js'));
app.use('/client/fonts', express.static('../fonts'));
app.use('/client/img/simple_dashed.png', express.static('../img/simple_dashed.png'));

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