import Lobby from '../components/lobby/Lobby.vue';
import Question from '../components/question/Question.vue';
import Results from '../components/results/Results.vue';
import SoundController from './sound.mjs';
import MonitorToServerConnection from './connection.mjs';
import Monitor from '../components/Monitor.vue';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import {createRouter, createWebHashHistory} from 'vue-router';
import {createApp} from 'vue';

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
	return {
		lng: 'en',
		supportedLngs: ['en', 'sv'],
		resources: resources,
		interpolation: {
			escapeValue: false
		}
	};
}

function getState(key, defaultValue) {
	if (key in window.history.state) {
		return JSON.parse(window.history.state[key]);
	}
	return defaultValue;
}

(async () => {
	const sound = new SoundController();
	const connection = new MonitorToServerConnection(new URL("..", document.location), () => crypto.randomUUID());

	const routes = [
		{
			path: '/',
			component: Lobby,
			props: (route) => ({
				connection: connection,
				sound: sound,
				preferredGameId: route.query.gameId
			})
		},
		{
			name: 'game',
			path: '/game',
			component: Question,
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
			component: Results,
			props: (route) => ({
				gameId: route.query.gameId,
				results: getState('results', {}),
				history: getState('history', []),
				sound: sound
			})
		},
	];

	const router = createRouter({
		history: createWebHashHistory('/trivia'),
		routes
	});

	let translationOptions = await loadLanguages();
	await i18next.init(translationOptions);

	const app = createApp(Monitor);

	app.use(I18NextVue, {i18next});
	app.use(router);
	await router.isReady();
	app.mount('#main');
})();
