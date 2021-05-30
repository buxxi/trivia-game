import Lobby from '../components/lobby.js';
import Question from '../components/question.js';
import Results from '../components/results.js';
import SoundController from '../sound.js';
import MonitorToServerConnection from '../connection.js';

function loadTemplate(url, component) {
	return (resolve, reject) => {
		fetch(url).then((response) => response.text()).then((data) => {
			component.template = data;
			resolve(component);
		});
	};
}

const sound = new SoundController();
const connection = new MonitorToServerConnection(new URL("..", document.location));

const routes = [
  	{ 
		path: '/',
		component: loadTemplate('./pages/lobby.html', Lobby),
		props: (route) => ({ 
				connection: connection,
				sound: sound,
				preferredGameId : route.query.gameId
		}) 
	},
	{
		name: 'game',
		path: '/game',
		component: loadTemplate('./pages/game-server.html', Question),
		props: (route) => ({ 
				connection: connection,
				gameId: route.params.gameId,
				lobbyPlayers: route.params.players,
				sound: sound
		})		 
	},
	{
		name: 'results',
		path: '/results',
		component: loadTemplate('./pages/results.html', Results),
		props: (route) => ({ 
			gameId: route.params.gameId,
			results: route.params.results,
			history: route.params.history
		})		 
	},
];

const router = new VueRouter({
  routes
});

const app = new Vue({
  router
}).$mount('#main');
