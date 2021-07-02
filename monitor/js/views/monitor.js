import Lobby from '../components/lobby.js';
import Question from '../components/question.js';
import Results from '../components/results.js';
import SoundController from '../sound.js';
import MonitorToServerConnection from '../connection.js';
import BlankPlayer from '../components/playback/blank.js';
import ImagePlayer from '../components/playback/image.js';
import QuotePlayer from '../components/playback/quote.js';
import ListPlayer from '../components/playback/list.js';
import AnswersPlayer from '../components/playback/answers.js';
import Mp3WavePlayer from '../components/playback/mp3.js';
import YoutubePlayer from '../components/playback/youtube.js';
import CategorySpinner from '../components/spinner.js';

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

Vue.component('blank-player', loadTemplate('./pages/playback/blank.html', BlankPlayer));
Vue.component('image-player', loadTemplate('./pages/playback/image.html', ImagePlayer));
Vue.component('quote-player', loadTemplate('./pages/playback/quote.html', QuotePlayer));
Vue.component('list-player', loadTemplate('./pages/playback/list.html', ListPlayer));
Vue.component('answers-player', loadTemplate('./pages/playback/answers.html', AnswersPlayer));
Vue.component('mp3-player', loadTemplate('./pages/playback/mp3.html', Mp3WavePlayer));
Vue.component('youtube-player', loadTemplate('./pages/playback/youtube.html', YoutubePlayer));
Vue.component('youtubeaudio-player', loadTemplate('./pages/playback/youtube.html', YoutubePlayer));
Vue.component('category-spinner', loadTemplate('./pages/spinner.html', CategorySpinner));

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
				gameId: route.query.gameId,
				lobbyPlayers: route.params.players,
				sound: sound
		})		 
	},
	{
		name: 'results',
		path: '/results',
		component: loadTemplate('./pages/results.html', Results),
		props: (route) => ({ 
			gameId: route.query.gameId,
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
