import {Protocol, PromisifiedWebSocket} from '../common/js/protocol.mjs';

class ServerToMonitorConnection {
    constructor(pws) {
        this._pws = pws;
    }

    playersChanged(players) {
        return this._pws.send(Protocol.PLAYERS_CHANGED, players);   
    }

    preloadProgress(category, current, total) {
        return this._pws.send(Protocol.PRELOAD_CATEGORY_PROGRESS(category), { current: current, total: total });
    }

    categorySelected(spinnerCategories, correct, index, total, ttsId) {
        return this._pws.send(Protocol.SHOW_CATEGORY_SELECT, {
            categories: spinnerCategories,
            correct: correct,
            index: index,
            total: total,
            ttsId: ttsId
        });
    }

    showQuestion(text, view, ttsId) {
        return this._pws.send(Protocol.SHOW_QUESTION, {
            text: text,
            view: view,
            ttsId:  ttsId
        });
    }

    questionError(message) {
        return this._pws.send(Protocol.QUESTION_ERROR, message);
    }

    questionStart(view, answers) {
        return this._pws.send(Protocol.QUESTION_START, { view: view, answers: answers });
    }

    questionEnd(pointsThisRound, correct) {
        return this._pws.send(Protocol.QUESTION_END, { pointsThisRound: pointsThisRound, correct: correct })
    }

    playerGuessed(clientId) {
        return this._pws.send(Protocol.PLAYER_GUESSED, clientId);
    }

    timerTick(timeLeft, percentageLeft, currentScore) {
        return this._pws.send(Protocol.TIMER_TICK, {
            timeLeft: timeLeft,
            percentageLeft: percentageLeft,
            currentScore: currentScore
        });
    }

    results(history, results) {
        return this._pws.send(Protocol.GAME_END, { history: history, results: results }); 
    }

    ping(pings) {
        return this._pws.send(Protocol.PING, pings);
    }

    onChangeLanguage() {
        return this._pws.on(Protocol.CHANGE_LANGUAGE);
    }

    onLoadCategories() {
        return this._pws.on(Protocol.LOAD_CATEGORIES);
    }

    onRemovePlayer() {
        return this._pws.on(Protocol.REMOVE_PLAYER);
    }

    onPreloadCategory() {
        return this._pws.on(Protocol.PRELOAD_CATEGORY);
    }

    onClearCache() {
        return this._pws.on(Protocol.CLEAR_CACHE);
    }

    onStartGame() {
        return this._pws.once(Protocol.START_GAME);
    }

    onClose() {
        return this._pws.onClose;
    }

    connected() {
        return this._pws.connected();
    }

    close() {
        this._pws.close();
    }

    clearSetupListeners() {
        this._pws.remove(Protocol.LOAD_CATEGORIES);
        this._pws.remove(Protocol.PRELOAD_CATEGORY);
        this._pws.remove(Protocol.REMOVE_PLAYER);
        this._pws.remove(Protocol.CLEAR_CACHE);
    }
}

class ServerToClientConnection {
    constructor(pws) {
        this._pws = pws;
    }

    questionStart(answers) {
        return this._pws.send(Protocol.QUESTION_START, answers, 5000);
    }

    questionEnd(pointsThisRound, correct) {
        return this._pws.send(Protocol.QUESTION_END, { pointsThisRound: pointsThisRound, correct: correct }, 5000);
    }
    
    gameEnd() {
        return this._pws.send(Protocol.GAME_END);
    }

    onGuess() {
        return this._pws.on(Protocol.GUESS);
    }

    onClose() {
        return this._pws.onClose;
    }

    close() {
        return this._pws.close();
    }

    ping() {
        let before = new Date().getTime();
        return this._pws.send(Protocol.PING, "ping", 5000).then(response => new Date().getTime() - before);
    }

    removeGuessListener() {
        this._pws.remove(Protocol.GUESS);
    }
}

class ServerConnection {
    constructor(ws) {
        this._pws = new PromisifiedWebSocket(ws, () => crypto.randomUUID());
    }

    onMonitorJoin() {
        return this._pws.once(Protocol.JOIN_MONITOR, 5000);
    }

    onClientJoin() {
        return this._pws.once(Protocol.JOIN_CLIENT, 5000);
    }

    toClient() {
        return new ServerToClientConnection(this._pws);
    }

    toMonitor() {
        return new ServerToMonitorConnection(this._pws);
    }
}

export default ServerConnection;