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
import AudioPlayer from '../components/playback/audio.js';
import VideoPlayer from '../components/playback/video.js';
import CategorySpinner from '../components/spinner.js';

function loadTemplate(url, component) {
	return () => {
		return fetch(url).then((response) => response.text()).then((data) => {
			component.template = data;
			return component;
		});
	}
}

async function loadLanguages() {
	let response = await fetch('/trivia/languages');
	let languages = await response.json();
	let messages = [];
	for (let language of languages) {
		let translationResponse = await fetch(`/trivia/translation/${language}`);
		let translations = await translationResponse.json();
		messages.push([language, translations]);
	}

	return {
		locale: languages[0],
		messages: Object.fromEntries(messages)
	}
}

function getState(key, defaultValue) {
	if (key in window.history.state) {
		return JSON.parse(window.history.state[key]);
	}
	return defaultValue;
}

const sound = new SoundController();
const connection = new MonitorToServerConnection(new URL("..", document.location), () => crypto.randomUUID());

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

loadLanguages().then((options) => {
	const i18n = VueI18n.createI18n(options);
	const app = Vue.createApp({});

	app.use(router);
	app.use(i18n);

	app.component('blank-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/blank.html', BlankPlayer)));
	app.component('image-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/image.html', ImagePlayer)));
	app.component('quote-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/quote.html', QuotePlayer)));
	app.component('list-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/list.html', ListPlayer)));
	app.component('answers-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/answers.html', AnswersPlayer)));
	app.component('audio-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/audio.html', AudioPlayer)));
	app.component('video-player', Vue.defineAsyncComponent(loadTemplate('./pages/playback/video.html', VideoPlayer)));
	app.component('category-spinner', Vue.defineAsyncComponent(loadTemplate('./pages/spinner.html', CategorySpinner)));

	app.mount('#main');
});
