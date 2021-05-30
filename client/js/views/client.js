import Join from '../components/join.js';
import Answer from '../components/answer.js';
import ClientToServerConnection from '../connection.js';

function loadTemplate(url, component) {
	return (resolve, reject) => {
		fetch(url).then((response) => response.text()).then((data) => {
			component.template = data;
			resolve(component);
		});
	};
}

const connection = new ClientToServerConnection(new URL("..", document.location));

const routes = [
	{
		path: '/',
		component: loadTemplate('./pages/join.html', Join),
		props: (route) => ({
			gameId: route.query.gameId,
			connection: connection
		})
	},
	{
		path: '/game',
		component: loadTemplate('./pages/game-client.html', Answer),
		props: (route) => ({
			gameId: route.query.gameId,
			clientId: route.query.clientId,
			connection: connection
		})
	}
];

const router = new VueRouter({
	routes
});

const app = new Vue({
	router
}).$mount('#main');
