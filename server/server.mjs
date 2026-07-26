import express from 'express';
import { WebSocketServer } from 'ws';
import {getTranslationBundle} from "./translation.mjs";
import logger from "./logger.mjs";

class TriviaServer {
	constructor(port, avatars, languages, repository, healthCheck) {
		this._port = port;
		this._avatars = avatars;
		this._languages = languages;
		this._repository = repository;
		this._healthCheck = healthCheck;
	}

	start() {
		const app = express();

		app.get('/trivia', (req, res) => {
			let isClient = !!req.headers['user-agent'].match(/Mobi/);
			res.redirect(isClient ? '/trivia/client' : '/trivia/monitor');
		});
		
		app.use('/trivia/common', express.static('common'));
		app.use('/trivia/translation/:language', (req, res) => { res.type("js").send(JSON.stringify(getTranslationBundle(req.params.language))); });

		app.use('/trivia/assets', express.static('dist/assets'));

		//Serve files for client
		app.use('/trivia/client', express.static('dist/client'));
		app.use('/trivia/client/avatars.json', (req, res) => { res.type("js").send(JSON.stringify(this._avatars)); });
		app.use('/trivia/client/js/ext/qcode-decoder.js', express.static('node_modules/qcode-decoder/build/qcode-decoder.min.js'));

		//Serve files for monitor
		app.use('/trivia/monitor', express.static('dist/monitor'));
		app.use('/trivia/monitor/img', express.static('monitor/img'));
		
		app.get('/trivia/tts', async (req, res) => {
			try {
				let gameId = req.query.gameId;
				let ttsId = req.query.ttsId;
				let tts = this._repository.getGame(gameId).text2Speech();
				let intArray = await tts.get(ttsId);
				res.send(Buffer.from(intArray));
			} catch (e) {
				logger.error(e);
				let status = typeof e == 'number' ? e : 500;
				res.sendStatus(status);
			}
		});

		app.use('/trivia/languages', async(req, res) => {
			res.json(this._languages);
		})

		app.use('/trivia/actuator/health', async(req, res) => {
			try {
				await this._healthCheck.check();
				res.send("{\"groups\":[\"liveness\",\"readiness\"],\"status\":\"UP\"}")
			} catch (e) {
				logger.error(e);
				res.status(503).send("{\"groups\":[\"liveness\",\"readiness\"],\"status\":\"DOWN\"}")
			}
		});

		//Init regular web server
		const server = app.listen(this._port, () => {
			logger.info(`Listening on ${this._port}!`)
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