import express from 'express';
import * as sass from 'sass';
import { WebSocketServer } from 'ws';
import {getTranslationBundle} from "./translation.mjs";
import logger from "./logger.mjs";
import {deprecations} from "sass";

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

		let clientStyle = sass.compile('client/css/client.scss', { silenceDeprecations: [deprecations["if-function"]]}).css;
		let monitorStyle = sass.compile('monitor/css/monitor.scss', { silenceDeprecations: [deprecations["if-function"]]}).css;
		
		app.get('/trivia', (req, res) => {
			let isClient = !!req.headers['user-agent'].match(/Mobi/);
			res.redirect(isClient ? '/trivia/client' : '/trivia/monitor');
		});
		
		app.use('/trivia/common', express.static('common'));
		app.use('/trivia/common/fonts/fontawesome', express.static('node_modules/@fortawesome/fontawesome-free/webfonts'));
		app.use('/trivia/common/fonts/ubuntu', express.static('node_modules/@fontsource/ubuntu/files'));
		app.use('/trivia/translation/:language', (req, res) => { res.type("js").send(JSON.stringify(getTranslationBundle(req.params.language))); });

		//Serve files for client
		app.use('/trivia/client', express.static('client'));
		app.get('/trivia/client/css/client.css', (req, res) => { res.type("css").send(clientStyle); });
		app.use('/trivia/client/js/ext/vue.js', express.static('node_modules/vue/dist/vue.esm-browser.prod.js'));
		app.use('/trivia/client/js/ext/vue-router.js', express.static('node_modules/vue-router/dist/vue-router.esm-browser.prod.js'));
		app.use('/trivia/client/js/ext/qcode-decoder.js', express.static('node_modules/qcode-decoder/build/qcode-decoder.min.js'));
		app.use('/trivia/client/avatars.json', (req, res) => { res.type("js").send(JSON.stringify(this._avatars)); });
		
		//Serve files for monitor
		app.use('/trivia/monitor', express.static('monitor'));
		app.get('/trivia/monitor/css/monitor.css', (req, res) => { res.type("css").send(monitorStyle); });
		app.use('/trivia/monitor/js/ext/vue.js', express.static('node_modules/vue/dist/vue.esm-browser.prod.js'));
		app.use('/trivia/monitor/js/ext/vue-router.js', express.static('node_modules/vue-router/dist/vue-router.esm-browser.prod.js'));
		app.use('/trivia/monitor/js/ext/i18next.js', express.static('node_modules/i18next/dist/esm/i18next.js'));
		app.use('/trivia/monitor/js/ext/i18next-vue.js', express.static('node_modules/i18next-vue/dist/index.mjs'));
		app.use('/trivia/monitor/js/ext/howler.js', express.static('node_modules/howler/dist/howler.min.js'));
		app.use('/trivia/monitor/js/ext/wavesurfer.js', express.static('node_modules/wavesurfer.js/dist/wavesurfer.esm.js'));
		app.use('/trivia/monitor/js/ext/qrcode-generator.js', express.static('node_modules/qrcode-generator/dist/qrcode.mjs'));
		
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