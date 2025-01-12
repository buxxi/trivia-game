class YoutubeVideoPlayer {
    constructor(delegate, videoId) {
        this._delegate = delegate;
        this._videoId = videoId;
        this.className = 'youtube';
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

class NormalVideoPlayer {
    constructor(delegate, url) {
        this._delegate = delegate;
        this._url = url;
        this.className = 'html5video';
    }

    async start () {
        return new Promise((resolve, reject) => {
            let video = document.createElement("video");
            video.src = this._url;
            video.controls = false;
            video.autoplay = true;
            document.querySelector('#video').appendChild(video);
            video.addEventListener('canplay', () => {
                this._delegate.playing = true;
                resolve();
            })
            video.addEventListener('error', () => reject(new Error("Could not load video")));
        });
    }

    async stop () {
        this._delegate.playing = false;
        document.querySelector('#video video').pause();
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
    computed: {
        className() {
            return this._player.className;
        }
    },
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