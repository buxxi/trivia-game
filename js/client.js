import Join from './join.js';
import Answer from './answer.js';
import Connection from './connection.js';

function loadTemplate(url, component) {
	return (resolve, reject) => {
		fetch(url).then((response) => response.text()).then((data) => {
			component.template = data;
			resolve(component);
		});
	};
}

const connection = new Connection(new Fingerprint2());

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
