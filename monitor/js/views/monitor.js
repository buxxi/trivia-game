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
				gameId: route.query.gameId,
				lobbyPlayers: getState('players', {}),
				sound: sound
		})		 
	},
	{
		name: 'results',
		path: '/results',
		component: loadTemplate('./pages/results.html', Results),
		props: (route) => ({ 
			gameId: route.query.gameId,
			results: getState('results', {}),
			history: getState('history', [])
		})		 
	},
];

const router = VueRouter.createRouter({
	history : VueRouter.createWebHashHistory(),
	routes 
});

const app = Vue.createApp({});

app.use(router);

app.component('blank-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/blank.html', BlankPlayer)));
app.component('image-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/image.html', ImagePlayer)));
app.component('quote-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/quote.html', QuotePlayer)));
app.component('list-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/list.html', ListPlayer)));
app.component('answers-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/answers.html', AnswersPlayer)));
app.component('mp3-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/mp3.html', Mp3WavePlayer)));
app.component('youtube-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/youtube.html', YoutubePlayer)));
app.component('youtubeaudio-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/youtube.html', YoutubePlayer)));
app.component('category-spinner', Vue.defineAsyncComponent(loadTemplate('./pages/spinner.html', CategorySpinner)));

app.mount('#main');
