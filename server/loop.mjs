import ConfigureState from './state/configure.mjs';

class GameLoop {
    constructor(game, categories, monitorSocket) {
        this._state = new ConfigureState(game, categories, [], monitorSocket);
    }
    
    run() {
		return new Promise(async (resolve, reject) => {
            while (this._state) {
                try {
                    console.log(`Starting state: ${this._state.constructor.name}`);
                    let result = await this._state.run();
                    console.log(`Finished state: ${this._state.constructor.name}`);
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