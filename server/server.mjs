import express from 'express';
import sass from 'node-sass';
import ws from 'ws';

class TriviaServer {
	constructor(port, avatars) {
		this._port = port;
		this._avatars = avatars;
	}

	start() {
		const app = express();

		let clientStyle = sass.renderSync({ file: 'client/css/client.scss' }).css.toString();
		let monitorStyle = sass.renderSync({ file: 'monitor/css/monitor.scss' }).css.toString();
		
		app.use('/index.html', express.static('index.html'));
		
		//Serve files for client
		app.use('/client', express.static('client'));
		app.get('/client/css/client.css', (req, res) => { res.type("css").send(clientStyle); });
		app.use('/client/css', express.static('css'));
		app.use('/client/js', express.static('js'));
		app.use('/client/js/ext/vue.min.js', express.static('node_modules/vue/dist/vue.min.js'));
		app.use('/client/js/ext/vue-router.min.js', express.static('node_modules/vue-router/dist/vue-router.min.js'));
		app.use('/client/js/ext/qcode-decoder.min.js', express.static('node_modules/qcode-decoder/build/qcode-decoder.min.js'));
		app.use('/client/js/ext/uuidv4.min.js', express.static('node_modules/uuid/dist/umd/uuidv4.min.js'));
		app.use('/client/fonts', express.static('fonts'));
		app.use('/client/img/simple_dashed.png', express.static('img/simple_dashed.png'));
		app.use('/client/img/avatars', express.static('img/avatars'));
		app.use('/client/avatars.json', (req, res) => { res.type("js").send(JSON.stringify(this._avatars)); });
		
		//Serve files for monitor
		app.use('/monitor', express.static('monitor'));
		app.get('/monitor/css/monitor.css', (req, res) => { res.type("css").send(monitorStyle); });
		app.use('/monitor/css', express.static('css'));
		app.use('/monitor/js', express.static('js'));
		app.use('/monitor/js/ext/vue.min.js', express.static('node_modules/vue/dist/vue.min.js'));
		app.use('/monitor/js/ext/vue-router.min.js', express.static('node_modules/vue-router/dist/vue-router.min.js'));
		app.use('/monitor/js/ext/Pizzicato.min.js', express.static('node_modules/pizzicato/distr/Pizzicato.min.js'));
		app.use('/monitor/js/ext/wavesurfer.min.js', express.static('node_modules/wavesurfer/dist/wavesurfer.min.js'));
		app.use('/monitor/js/ext/uuidv4.min.js', express.static('node_modules/uuid/dist/umd/uuidv4.min.js'));
		app.use('/monitor/fonts', express.static('fonts'));
		app.use('/monitor/img/simple_dashed.png', express.static('img/simple_dashed.png'));
		app.use('/monitor/img/avatars', express.static('img/avatars'));
		
		//Init regular web server
		const server = app.listen(this._port, () => {
			console.log(`Listening on ${this._port}!`)
		});
		
		//Init websocket server
		this._wsServer = new ws.Server({ noServer: true });
		
		server.on('upgrade', (request, socket, head) => {
			this._wsServer.handleUpgrade(request, socket, head, socket => {
				this._wsServer.emit('connection', socket, request);
			});
		});
	}

	addWebSocketConnectionListener(listener) {
        this._wsServer.on('connection', listener);    
    }
}

export default TriviaServer;