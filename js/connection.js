triviaApp.service('connection', function($rootScope) {
	function Connection() {
		var self = this;
		var peer = { id : null };
		var clients = [];
		var host = null;

		function dataEvent(conn, data) {
			var command = Object.keys(data)[0];
			var params = data[command];
			$rootScope.$broadcast('data-' + command, conn, params);
		}

		self.connect = function() {
			return new Promise(function(resolve, reject) {
				peer = new Peer({
					host : window.location.host,
					port : 443,
					path : '/peer',
					config: {
						iceServers: [
  							{ url: 'stun:stun1.l.google.com:19302' }
						]
					}
				});

				peer.on('open', function(id) {
					resolve();
				});

				peer.on('error', function(err) {
					reject(err);
				});
			});
		}

		self.disconnect = function() {
			peer.disconnect();
		}

		self.host = function() {
			return new Promise(function(resolve, reject) {
				peer.on('connection', function(conn) {
					clients.push(conn);
					conn.on('data', function(data) {
						dataEvent(conn, data);
					});
				});

				resolve();
			});
		}

		self.join = function(peerid, name) {
			return new Promise(function(resolve, reject) {
				peer.on('error', function(err) {
					reject(err);
				});

				host = peer.connect(peerid.toLowerCase());

				host.on('open', function() {
					host.on('data', function(data) {
						dataEvent(host, data);
					});

					var removeListener = $rootScope.$on('data-wait', function() {
						resolve();
						removeListener();
					});

					host.send({
						join : { name : name }
					});

					host.on('close', function() {
						$rootScope.$broadcast('host-disconnected');
					});
				});
			});
		}

		self.sendHost = function(data) {
			host.send(data);
		}

		self.sendAll = function(data) {
			clients.forEach(function(conn) {
				conn.send(data);
			});
		}

		self.peerid = function() {
			return peer.id;
		}
	};

	return new Connection();
});
