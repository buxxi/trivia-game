import logger from '../../common/js/browser-logger.mjs';

export function uuidPolyfill() {
    let crypto = window.crypto;

    if (!('randomUUID' in crypto)) {
        logger.warn("No randomUUID available, using polyfill");
        crypto.randomUUID = () => {
            return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }
    }
}