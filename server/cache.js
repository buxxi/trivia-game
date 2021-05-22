/*const dbPromise = idb.open('keyval-store', 1, upgradeDB => {
	upgradeDB.createObjectStore('keyval');
});

const idbKeyval = {
	get : function(key) {
		return dbPromise.then(db => {
			return db.transaction('keyval').objectStore('keyval').get(key);
		});
	},
	set : function(key, val) {
		return dbPromise.then(db => {
			const tx = db.transaction('keyval', 'readwrite');
			tx.objectStore('keyval').put(val, key);
			return tx.complete;
		});
	},
	clear : function() {
		return dbPromise.then(db => {
			const tx = db.transaction('keyval', 'readwrite');
			tx.objectStore('keyval').clear();
			return tx.complete;
		});
	}
}

export default function Cache(primaryKey) {
	var self = this;

	self.get = function(subKey, promiseFunction) {
		return new Promise((resolve, reject) => {
			var key = primaryKey + "-" + subKey;

			idbKeyval.get(key).then((val) => {
				if (!val) {
					promiseFunction((result) => {
						idbKeyval.set(key, result).then(() => resolve(result)).catch(reject);
					}, reject);
				} else {
					resolve(val);
				}
			}).catch(reject);
		});
    }
    
    self.clearAll = function() {
        idbKeyval.clear();
    }
}*/

class NoCache {
	get(subKey, promiseFunction) {
		return new Promise((resolve, reject) => {
			promiseFunction(result => {
				resolve(result);
			});
		});
	}

	clearAll() {

	}
}

module.exports = {
	Cache : NoCache
}