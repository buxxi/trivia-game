import express from 'express';
import * as sass from 'sass';
import { WebSocketServer } from 'ws';

class TriviaServer {
	constructor(port, avatars, repository) {
		this._port = port;
		this._avatars = avatars;
		this._repository = repository;
	}

	start() {
		const app = express();

		let clientStyle = sass.compile('client/css/client.scss').css;
		let monitorStyle = sass.compile('monitor/css/monitor.scss').css;
		
		app.get('/trivia', (req, res) => {
			let isClient = !!req.headers['user-agent'].match(/Mobi/);
			res.redirect(isClient ? '/trivia/client' : '/trivia/monitor');
		});
		
		app.use('/trivia/common', express.static('common'));
		app.use('/trivia/common/fonts/fontawesome', express.static('node_modules/@fortawesome/fontawesome-free/webfonts'));
		app.use('/trivia/common/fonts/ubuntu', express.static('node_modules/@fontsource/ubuntu/files'));

		//Serve files for client
		app.use('/trivia/client', express.static('client'));
		app.get('/trivia/client/css/client.css', (req, res) => { res.type("css").send(clientStyle); });
		app.use('/trivia/client/js/ext/vue.min.js', express.static('node_modules/vue/dist/vue.global.prod.js'));
		app.use('/trivia/client/js/ext/vue-router.min.js', express.static('node_modules/vue-router/dist/vue-router.global.prod.js'));
		app.use('/trivia/client/js/ext/qcode-decoder.min.js', express.static('node_modules/qcode-decoder/build/qcode-decoder.min.js'));
		app.use('/trivia/client/avatars.json', (req, res) => { res.type("js").send(JSON.stringify(this._avatars)); });
		
		//Serve files for monitor
		app.use('/trivia/monitor', express.static('monitor'));
		app.get('/trivia/monitor/css/monitor.css', (req, res) => { res.type("css").send(monitorStyle); });
		app.use('/trivia/monitor/js/ext/vue.min.js', express.static('node_modules/vue/dist/vue.global.prod.js'));
		app.use('/trivia/monitor/js/ext/vue-router.min.js', express.static('node_modules/vue-router/dist/vue-router.global.prod.js'));
		app.use('/trivia/monitor/js/ext/Pizzicato.min.js', express.static('node_modules/pizzicato/distr/Pizzicato.min.js'));
		app.use('/trivia/monitor/js/ext/wavesurfer.min.js', express.static('node_modules/wavesurfer.js/dist/wavesurfer.min.js'));
		app.use('/trivia/monitor/js/ext/qrcode.min.js', express.static('node_modules/qrcode/build/qrcode.js'));
		
		app.get('/trivia/tts', async (req, res) => {
			try {
				let gameId = req.query.gameId;
				let ttsId = req.query.ttsId;
				let tts = this._repository.getGame(gameId).text2Speech();
				let intArray = await tts.get(ttsId);
				res.send(Buffer.from(intArray));
			} catch (e) {
				console.log(e);
				let status = typeof e == 'number' ? e : 500;
				res.sendStatus(status);
			}
		});

		//Init regular web server
		const server = app.listen(this._port, () => {
			console.log(`Listening on ${this._port}!`)
		});
		
		//Init websocket server
		this._wsServer = new WebSocketServer({ noServer: true });
		
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