import Join from '../components/join.js';
import Answer from '../components/answer.js';
import {ClientConnection} from '../js/connection.js';

function loadTemplate(url, component) {
	return (resolve, reject) => {
		fetch(url).then((response) => response.text()).then((data) => {
			component.template = data;
			resolve(component);
		});
	};
}

const connection = new ClientConnection(new Fingerprint2());

const routes = [
  { path: '/', component: loadTemplate('./pages/join.html', Join), props: (route) => ({ code: route.query.code, connection: connection }) },
  { path: '/game', component: loadTemplate('./pages/game-client.html', Answer), props: { connection: connection }}
];

const router = new VueRouter({
  routes
});

const app = new Vue({
  router
}).$mount('#main');
