import {Protocol, PromisifiedWebSocket} from '../js/protocol.mjs';

class MonitorToServerConnection {
    connect(forcePairCode) {
        return new Promise((resolve, reject) => {});
    }

    loadCategories() {
        return new Promise((resolve, reject) => {});
    }

    loadAvatars() {
        return new Promise((resolve, reject) => {});
    }

    removePlayer(pairCode) {
        return new Promise((resolve, reject) => {});
    }

    clearCache() {
        return new Promise((resolve, reject) => {});
    }

    startGame(config) {
        return new Promise((resolve, reject) => {});
    }

    preloadCategory(type, progress) {
        return new Promise((resolve, reject) => {});
    }

    onPlayersChange(callback) {

    }
}

export default MonitorToServerConnection;