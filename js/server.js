import avatars from './avatars.js';
import Lobby from './lobby.js';
import Question from './question.js';
import Results from './results.js';

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
const youtube = new YoutubeLoader();
const movies = new MovieQuestions(youtube);
const music = new MusicQuestions();
const geography = new GeographyQuestions();
const quotes = new QuotesQuestions();
const videogames = new VideoGameQuestions(youtube);
const drinks = new DrinksQuestions();
const actors = new ActorQuestions();
const meta = new CurrentGameQuestions(avatars);
const genericloader = new GenericCategoryLoader();
const categories = new Categories(movies, music, geography, quotes, videogames, drinks, actors, meta, genericloader);
const game = new Game(avatars, categories);
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
