import Join from '../components/Join.vue';
import Answer from '../components/Answer.vue';
import Client from '../components/Client.vue';
import ClientToServerConnection from './connection.mjs';
import WakeLock from './wakelock.mjs';
import ClientState from './clientstate.mjs';
import {createRouter, createWebHashHistory} from 'vue-router';
import {createApp} from 'vue';
import {uuidPolyfill} from "./uuidpolyfill.mjs";
import {barcodeDetectorPolyfill} from "./barcodedetectorpolyfill.mjs";

function getState(key, defaultValue) {
	if (key in window.history.state) {
		return JSON.parse(window.history.state[key]);
	}
	return defaultValue;
}

(async () => {
	uuidPolyfill();
	barcodeDetectorPolyfill();

	const connection = new ClientToServerConnection(new URL("..", document.location), () => crypto.randomUUID());
	const wakelock = new WakeLock();
	const clientState = new ClientState();

	const routes = [
		{
			path: '/',
			name: 'join',
			component: Join,
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
			component: Answer,
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
		history: createWebHashHistory('/trivia/'),
		routes
	});

	const app = createApp(Client);

	app.use(router);

	await router.isReady();
	app.mount('#main');
})();