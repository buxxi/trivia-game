import ConfigureState from './state/configure.mjs';

class GameLoop {
    constructor(game, id, categories, monitorSocket) {
        this._id = id;
        this._state = new ConfigureState(game, categories, [], monitorSocket);
    }
    
    run() {
		return new Promise(async (resolve, reject) => {
            while (this._state) {
                try {
                    console.log(`Game ${this._id} - Starting state: ${this._state.constructor.name}`);
                    let result = await this._state.run();
                    console.log(`Game ${this._id} - Finished state: ${this._state.constructor.name}`);
                    this._state = this._state.nextState(result);
                } catch (e) {
                    this._state = this._state.errorState(e);
                }
            }
			resolve();
		});
	}
}

export default GameLoop;