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

import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import {createRouter, createWebHashHistory} from 'vue-router';
import {createApp, defineAsyncComponent} from 'vue';

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

	let resources = Object.fromEntries(messages.map(([language, translations]) => [language, {translation: translations}]));
	let options = {
		lng: 'en',
		supportedLngs : ['en', 'sv'],
		resources: resources,
		interpolation: {
			prefix: '{',
			suffix: '}',
			nestingPrefix: '$(',
			nestingSuffix: ')',
			escapeValue: false
		}
	};
	return options;
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

const router = createRouter({
	history : createWebHashHistory(),
	routes 
});

loadLanguages().then((options) => {
	i18next.init(options);
	const app = createApp({});

	app.use(I18NextVue, { i18next });
	app.use(router);

	app.component('blank-player', defineAsyncComponent(loadTemplate('./pages/playback/blank.html', BlankPlayer)));
	app.component('image-player', defineAsyncComponent(loadTemplate('./pages/playback/image.html', ImagePlayer)));
	app.component('quote-player', defineAsyncComponent(loadTemplate('./pages/playback/quote.html', QuotePlayer)));
	app.component('list-player', defineAsyncComponent(loadTemplate('./pages/playback/list.html', ListPlayer)));
	app.component('answers-player', defineAsyncComponent(loadTemplate('./pages/playback/answers.html', AnswersPlayer)));
	app.component('audio-player', defineAsyncComponent(loadTemplate('./pages/playback/audio.html', AudioPlayer)));
	app.component('video-player', defineAsyncComponent(loadTemplate('./pages/playback/video.html', VideoPlayer)));
	app.component('category-spinner', defineAsyncComponent(loadTemplate('./pages/spinner.html', CategorySpinner)));

	app.mount('#main');
});
