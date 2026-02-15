import { promises as fs } from 'fs';
import TriviaServer from './server.mjs';
import Game from './game.mjs';
import Categories from './categories.mjs';
import GameLoop from './loop.mjs';
import ServerConnection from './connection.mjs';
import Text2Speech from './tts.mjs';
import GameStatistics from './stats.mjs';
import {configPath} from "./xdg.mjs";
import {init as translationInit} from "./translation.mjs";
import logger from "./logger.mjs";
import HealthCheck from "./healthcheck.mjs";

class GameRepository {
	constructor(categories, config) {
		this._categories = categories;
		this._config = config;
		this._currentGames = {};
	}

	getGame(gameId) {
		if (!(gameId in this._currentGames)) {
			throw new Error("No game with id: " + gameId);
		}
		return this._currentGames[gameId];
	}

	startGame(gameId, monitorConnection) {
		let game = new Game(this._categories, this._config.avatars);
		let stats = new GameStatistics(this._config.statsPath, gameId);
		let tts = new Text2Speech(this._config.tts);
		let loop = new GameLoop(game, gameId, this._categories, monitorConnection, tts, stats);
		
		
		if (gameId in this._currentGames) {
			throw new Error("Game " + gameId + " is already running");
		}
		this._currentGames[gameId] = loop;
		loop.run().finally(() => {
			delete this._currentGames[gameId];
		})

		return gameId;
	}
}

async function loadConfig() {
	logger.info("Loading config");
	return JSON.parse(await fs.readFile(configPath()));
}

async function loadTranslations(config) {
	logger.info("Loading translations");
	await translationInit(config);
}

async function loadCategories(config) {
	logger.info("Loading categories");
	let categories = new Categories(config);
	await categories.init();
	return categories;
}

function startServer(config, repository) {
	logger.info("Starting server");
	let server = new TriviaServer(8080, config.avatars, config.languages, repository, new HealthCheck(config));
	server.start();
	return server;
}

async function init() {
	let config = await loadConfig();
	await loadTranslations(config);
	let categories = await loadCategories(config);
	let repository = new GameRepository(categories, config);
	let server = startServer(config, repository);

	server.addWebSocketConnectionListener(socket => {
		let connection = new ServerConnection(socket);

		let monitorJoin = connection.onMonitorJoin().then(async (gameId) => {
			if (!gameId) {
				gameId = crypto.randomUUID();
			}
			repository.startGame(gameId, connection.toMonitor());
			return gameId;
		});

		let clientJoin = connection.onClientJoin().then(async (data) => {
			let game = repository.getGame(data.gameId);
			let clientId = data.clientId ? data.clientId : crypto.randomUUID();
			let stats = game.addClient(connection.toClient(), clientId, data.userName, data.preferredAvatar);
			return { clientId: clientId, stats: stats };
		});

		Promise.race([monitorJoin, clientJoin]).catch(e => {
			socket.close();
		});
	});
}

init();