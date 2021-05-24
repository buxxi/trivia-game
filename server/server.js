const express = require('express');
const path = require('path');
const sass = require('node-sass');
const ws = require('ws');
const app = express();
const port = 5555;

let clientStyle = sass.renderSync({
	file: 'client/css/client.scss'
}).css.toString();
let monitorStyle = sass.renderSync({
	file: 'monitor/css/monitor.scss'
}).css.toString();

app.use('/index.html', express.static('index.html'));

//Serve files for client
app.use('/client', express.static('client'));
app.get('/client/css/client.css', (req, res) => { res.type("css").send(clientStyle); });
app.use('/client/css', express.static('css'));
app.use('/client/js', express.static('js'));
app.use('/client/fonts', express.static('fonts'));
app.use('/client/img/simple_dashed.png', express.static('img/simple_dashed.png'));

//Serve files for monitor
app.use('/monitor', express.static('monitor'));
app.get('/monitor/css/monitor.css', (req, res) => { res.type("css").send(monitorStyle); });
app.use('/monitor/css', express.static('css'));
app.use('/monitor/js', express.static('js'));
app.use('/monitor/fonts', express.static('fonts'));
app.use('/monitor/img/simple_dashed.png', express.static('img/simple_dashed.png'));

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