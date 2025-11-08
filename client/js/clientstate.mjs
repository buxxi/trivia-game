const IN_PROGRESS_GAME_ID = 'inProgressGameId';
const IN_PROGRESS_CLIENT_ID = 'inProgressClientId';

class ClientState {
    getInProgressGameId() {
        return localStorage.getItem(IN_PROGRESS_GAME_ID);
    }

    getInProgressClientId() {
        return localStorage.getItem(IN_PROGRESS_CLIENT_ID);
    }

    setInProgressGameId(gameId) {
        localStorage.setItem(IN_PROGRESS_GAME_ID, gameId);
    }

    setInProgressClientId(clientId) {
        localStorage.setItem(IN_PROGRESS_CLIENT_ID, clientId);
    }

    clearInProgressGameId() {
        localStorage.removeItem(IN_PROGRESS_GAME_ID);
    }

    clearInProgressClientId() {
        localStorage.removeItem(IN_PROGRESS_CLIENT_ID);
    }
}

export default ClientState;