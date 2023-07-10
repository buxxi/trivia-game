import Join from '../components/join.js';
import Answer from '../components/answer.js';
import ClientToServerConnection from '../connection.mjs';
import WakeLock from '../wakelock.mjs';

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

const connection = new ClientToServerConnection(new URL("..", document.location));
const wakelock = new WakeLock();

const routes = [
	{
		path: '/',
		name: 'join',
		component: loadTemplate('./pages/join.html', Join),
		props: (route) => ({
			gameId: route.query.gameId,
			connection: connection,
			wakelock: wakelock,
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
			stats: getState('stats', {})
		})
	}
];

const router = VueRouter.createRouter({
	history : VueRouter.createWebHashHistory(),
	routes 
});

const app = Vue.createApp({});

app.use(router);

app.mount('#main');
