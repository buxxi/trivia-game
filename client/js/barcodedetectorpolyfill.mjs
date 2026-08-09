async function loadQCodeDecoder() {
    return new Promise((resolve, reject) => {
        if (window.QCodeDecoder) {
            resolve(window.QCodeDecoder());
            return;
        }
        const script = document.createElement('script');
        script.src = '/trivia/client/js/ext/qcode-decoder.js';
        script.onload = () => resolve(window.QCodeDecoder());
        script.onerror = () => reject(new Error('Failed to load qcode-decoder'));
        document.head.appendChild(script);
    });
}

class BarcodeDetectorPolyfill {
    constructor(options = {}) {
        this.formats = options.formats || ['qr_code'];
        this.decoder = null;
    }

    async detect(imageSource) {
        if (!this.decoder) {
            this.decoder = await loadQCodeDecoder();
        }
        if (imageSource instanceof Blob) {
            return Promise.reject(new Error("Only canvas image source can be detected"));
        }

        return new Promise((resolve, reject) => {
            try {
                this.decoder.stop();
                this.decoder.decodeFromVideo(imageSource, (result, data) => {
                    resolve(this._formatResults(data));
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    _formatResults(qrData) {
        if (!qrData) {
            return [];
        }

        return [{
            format: 'qr_code',
            rawValue: qrData,
            boundingBox: {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            cornerPoints: []
        }];
    }
}

export function barcodeDetectorPolyfill() {
    if (!('BarcodeDetector' in window)) {
        window.BarcodeDetector = BarcodeDetectorPolyfill;
    }
}