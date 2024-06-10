import fetch from 'node-fetch';

class Text2Speech {
    constructor(ttsUrl) {
        this._ttsUrl = ttsUrl;
        this._requests = {};
    }

    load(text) {
        let ttsId = crypto.randomUUID();
        if (!this._ttsUrl) {
            this._requests[ttsId] = {response: {ok : false, data: "No TTS server url configured"}};
        } else if (!text) {
            this._requests[ttsId] = {response: {ok : false, data: "No TTS text provided"}};
        } else {
            let url = this._ttsUrl.replace('{text}', encodeURIComponent(text));
            this._requests[ttsId] = {response: {ok : undefined, data: undefined}};
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this._requests[ttsId].response = {ok : true, data: new Uint8Array(arrayBuffer)})
                .catch(e => this._requests[ttsId].response = {ok: false, data: e.toString() });
        }
        return ttsId;
    }

    get(ttsId) {
        return new Promise((resolve, reject) => {
            let handler = {
                set(target, prop, value) {
                    target[prop] = value;
                    if (typeof target.response.ok !== "undefined") {
                        if (target.response.ok) {
                            resolve(target.response.data);
                        } else {
                            reject(target.response.data);
                        }
                    }
                    return true;
                }
            };
            this._requests[ttsId] = new Proxy(this._requests[ttsId], handler);
            //Trigger the proxy if it was already set before this get call was done
            this._requests[ttsId].response = this._requests[ttsId].response;
        });
    }
}

export default Text2Speech;