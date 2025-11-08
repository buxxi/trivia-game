import Join from '../components/join.js';
import Answer from '../components/answer.js';
import ClientToServerConnection from '../connection.mjs';
import WakeLock from '../wakelock.mjs';
import ClientState from '../clientstate.mjs';
import {createRouter, createWebHashHistory} from 'vue-router';
import {createApp} from 'vue';

function uuidPolyfill() {
	let crypto = window.crypto;

	if (!('randomUUID' in crypto)) {
		console.log("No randomUUID available, using polyfill");
		crypto.randomUUID = () => {
			return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
				(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
			);
		}
	}
}

function loadTemplate(url, component) {
	return () => {
		return fetch(url).then((response) => response.text()).then((data) => {
			component.template = data;
			return component;
		});
	}
}

function getState(key, defaultValue) {
	if (key in window.history.state) {
		return JSON.parse(window.history.state[key]);
	}
	return defaultValue;
}

uuidPolyfill();

const connection = new ClientToServerConnection(new URL("..", document.location), () => crypto.randomUUID());
const wakelock = new WakeLock();
const clientState = new ClientState();

const routes = [
	{
		path: '/',
		name: 'join',
		component: loadTemplate('./pages/join.html', Join),
		props: (route) => ({
			gameId: route.query.gameId,
			connection: connection,
			wakelock: wakelock,
			clientState: clientState,
			name: route.query.name,
			preferredAvatar: route.query.preferredAvatar
		})
	},
	{
		name: 'game',
		path: '/game',
		component: loadTemplate('./pages/game-client.html', Answer),
		props: (route) => ({
			gameId: route.query.gameId,
			clientId: route.query.clientId,
			connection: connection,
			wakelock: wakelock,
			clientState: clientState,
			stats: getState('stats', {})
		})
	}
];

const router = createRouter({
	history : createWebHashHistory(),
	routes 
});

const app = createApp({});

app.use(router);

app.mount('#main');
