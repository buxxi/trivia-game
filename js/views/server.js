import avatars from '../avatars.js';
import Lobby from '../components/lobby.js';
import Question from '../components/question.js';
import Results from '../components/results.js';
import Categories from '../categories.js';
import Connection from '../connection.js';
import Game from '../game.js';
import SoundController from '../sound.js';
import Playback from '../playback.js';

function loadTemplate(url, component) {
	return (resolve, reject) => {
		fetch(url).then((response) => response.text()).then((data) => {
			component.template = data;
			resolve(component);
		});
	};
}

const fingerprint = new Fingerprint2();
const connection = new Connection(fingerprint);
const categories = new Categories();
const game = new Game(categories);
const sound = new SoundController(game);
const playback = new Playback();

const routes = [
  	{ 
		path: '/',
		component: loadTemplate('./pages/lobby.html', Lobby),
		props: (route) => ({ 
				connection: connection,
				game: game,
				categories: categories,
				sound: sound,
				avatars: avatars,
				fingerprint: fingerprint,
				fakePlayers: route.query.fakePlayers,
				forcePairCode : route.query.forcePairCode
		}) 
	},
	{
		path: '/game',
		component: loadTemplate('./pages/game-server.html', Question),
		props: (route) => ({ 
			connection: connection,
			game: game,
			playback: playback,
			sound: sound,
			avatars: avatars,
			categories: categories
		})		 
	},
	{
		path: '/results',
		component: loadTemplate('./pages/results.html', Results),
		props: (route) => ({ 
			game: game,
			sound: sound,
			avatars: avatars
		})		 
	},
];

const router = new VueRouter({
  routes
});

const app = new Vue({
  router
}).$mount('#main');
