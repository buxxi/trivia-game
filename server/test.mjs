import WebSocket from 'ws';
import {PromisifiedWebSocket, Protocol} from '../js/protocol.js';
import Game from './game.mjs';
import Categories from './categories.mjs';

/*
const socket = new WebSocket('ws://localhost:5555');

socket.on('open', () => {
	const psocket = new PromisifiedWebSocket(socket);

	psocket.send(Protocol.JOIN_MONITOR, { gameid: 123 }).then((response) => {
		console.log("Got response #1: " + response);
	}).catch(e => {
		console.log("Error #1: " + e);
	});
});
*/

(async function() {
	const categories = new Categories();

	await categories.init();

	const game = new Game(categories);

	game.addPlayer("foo", "MrBoki", "horse");
	game.addPlayer("bar", "MrBoki2", "horse");
	game.addPlayer("qwe", "MrBoki3", "horse");
	game.addPlayer("rty", "MrBoki4", "horse");

	game.config().categories = {
		'geography' : true
	};
	game.config().time = 5;

	await categories.preload("geography", (from, to) => {}, game);

	game.configure();
	let question = await game.nextQuestion();
	console.log("First round start");
	console.log(question);
	let roundEnd = game.startTimer(() => {});

	console.log("Guessing");
	await new Promise((resolve, reject) => { setTimeout(resolve, 500); });
	game.guess("foo", "A");
	await new Promise((resolve, reject) => { setTimeout(resolve, 500); });
	game.guess("bar", "B");
	await new Promise((resolve, reject) => { setTimeout(resolve, 500); });
	game.guess("qwe", "C");
	await new Promise((resolve, reject) => { setTimeout(resolve, 500); });
	game.guess("rty", "D");

	let points = await roundEnd;
	console.log("First round ended");
	console.log(points);
	console.log(game.players());

})();
