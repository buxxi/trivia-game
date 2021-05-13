const express = require('express');
const ws = require('ws');
const app = express();
const port = 5555;

app.use('/index.html', express.static('index.html'));

//Serve files for client
app.use('/client', express.static('../client'));
app.use('/client/css', express.static('../css'));
app.use('/client/js', express.static('../js'));
app.use('/client/js/avatars.js', express.static('../js/avatars.js'));
app.use('/client/js/connection.js', express.static('../js/connection.js'));
app.use('/client/fonts', express.static('../fonts'));
app.use('/client/img/simple_dashed.png', express.static('../img/simple_dashed.png'));

//Serve files for monitor
app.use('/monitor', express.static('../monitor'));
app.use('/monitor/css', express.static('../css'));
app.use('/monitor/js', express.static('../js'));
app.use('/monitor/js/avatars.js', express.static('../js/avatars.js'));
app.use('/monitor/js/connection.js', express.static('../js/connection.js'));
app.use('/monitor/fonts', express.static('../fonts'));
app.use('/monitor/img/simple_dashed.png', express.static('../img/simple_dashed.png'));
app.use('/monitor/conf', express.static('../conf'));

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