class YoutubeVideoPlayer {
    constructor(delegate, videoId) {
        this._delegate = delegate;
        this._videoId = videoId;
    }

    async start () {
        let self = this;

        await this._loadIframeAPI();

        return new Promise((resolve, reject) => {
            self._youtube = new YT.Player('video', {
                height: '100%',
                width: '100%',
                videoId: this._videoId,
                playerVars : {
                    autoplay : 1,
                    controls : 0,
                    hd : 1
                },
                events: {
                    onStateChange: (state) => {
                        if (state.data == 1) {
                            this._delegate.playing = true;
                            resolve();
                        }
                    }
                }
            });
        });
    }

    async stop() {
        this._delegate.playing = false;
        this._youtube.stopVideo();
    }

    _loadIframeAPI() {
        let api = 'https://www.youtube.com/iframe_api';
        let node = document.querySelector(`script[src='${api}']`);
        if (node) {
            return Promise.resolve(true);
        } else {
            return new Promise((resolve, reject) => {
                window.onYouTubeIframeAPIReady = () => resolve(true);
                let script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = api;
                document.getElementsByTagName('head')[0].appendChild(script);
            })
        }
    }
}

//TODO: implement me
class NormalVideoPlayer {
    constructor(delegate, url) {
        this._delegate = delegate;
        this._url = url;
    }

    async start () {
        throw new Error("Not implemented");
    }

    async stop () {
        throw new Error("Not implemented");
    }
}

export default {
    data: function() { return {
        _player: {},
        pauseMusic: true,
        minimizeQuestion: true,
        playing : false
    }},
    props: ['view'],
    methods: {
        start: async function() {
            let url = new URL(this.view.url);

            if (url.hostname === 'www.youtube.com') {
                let videoId = url.searchParams.get('v');
                this._player = new YoutubeVideoPlayer(this, videoId);
            } else {
                this._player = new NormalVideoPlayer(this, this.view.url);
            }
            try {
                await Promise.race([this._player.start(), this._timeout()]);
            } catch (e) {
                this.stop();
                throw e;
            }
        },

        stop: async function() {
            this._player.stop();
        },

        _timeout() {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error("Didn't start playback before timeout"));
                }, 5000);
            });
        }
    }
}