import fetch from 'node-fetch';
import {v4 as uuid} from 'uuid';

//TODO: better error handling
class Text2Speech {
    constructor(ttsUrl) {
        this._ttsUrl = ttsUrl;
        this._requests = {};
    }

    load(text) {
        if (!this._ttsUrl) {
            throw 403;
        }
        if (!text) {
            throw 400;
        }

        let url = this._ttsUrl.replace('{text}', encodeURIComponent(text));
        let ttsId = uuid();
        this._requests[ttsId] = fetch(url);
        return ttsId;
    }

    async get(ttsId) {
        let response = await this._requests[ttsId];
        delete this._requests[ttsId];
        let arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }
}

export default Text2Speech;