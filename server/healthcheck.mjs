import {constants as fsConstants, promises as fs} from 'fs';
import {customDataPath, statsPath} from './xdg.mjs';

class HealthCheck {
    constructor(config) {
        this._config = config;
    }

    async check() {
        await this._checkTtsConnectivity();
        await this._checkCustomDataReadability();
        await this._checkStatsPathWriteability();
    }

    async _checkTtsConnectivity() {
        if (!this._config.tts || !this._config.tts.url) {
            return;
        }

        let res = await fetch(this._config.tts.url, { method: 'OPTIONS' });
        if (!res || !res.ok) {
            throw new Error(`TTS URL did not respond with a successful status: ${res ? res.status : 'no response'}`);
        }
    }

    async _checkCustomDataReadability() {
        let dataPathMap = this._config.dataPath;
        let languages = this._config.languages;
        if (!dataPathMap) {
            return;
        }

        for (let [key, template] of Object.entries(dataPathMap)) {
            for (let lang of languages) {
                let fileName = template.replace('{language}', lang);
                let absolute = customDataPath(fileName);
                try {
                    await fs.access(absolute, fsConstants.R_OK);
                } catch (err) {
                    throw new Error(`Custom data file not readable: ${absolute} (category: ${key}, language: ${lang})`);
                }
            }
        }
    }

    async _checkStatsPathWriteability() {
        let tmp = statsPath(`.healthcheck-${process.pid}-${Date.now()}`);
        try {
            await fs.writeFile(tmp, 'ok');
            await fs.unlink(tmp);
        } catch (err) {
            throw new Error(`Stats path not writable: ${tmp} (${err.message})`);
        }
    }
}

export default HealthCheck;