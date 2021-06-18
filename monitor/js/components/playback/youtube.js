export default {
    data: function() { return {
        player: {},
        pauseMusic: true,
        minimizeQuestion: true,
        playing : false,
        started: false
    }},
    props: ['view'],
    computed: {
        videoId: function() {
            return this.view.videoId;
        },
        playerClass: function() {
            return this.view.player == 'youtube' ? 'youtube' : 'youtubeaudio';
        }
    },
    methods: {
        start: async function() {
            let self = this;
            this.started = true;
            
            await this.$nextTick();

            return new Promise((resolve, reject) => {
                let startTimeout = setTimeout(() => {
                    self.stop();
                    reject("Didn't start playback before timeout");
                }, 5000);

                self.player = new YT.Player('video', {
                    height: '100%',
                    width: '100%',
                    videoId: self.videoId,
                    playerVars : {
                        autoplay : 1,
                        controls : 0,
                        hd : 1
                    },
                    events: {
                        onStateChange: (state) => {
                            if (state.data == 1) {
                                clearTimeout(startTimeout);
                                self.playing = true;
                                resolve();
                            }
                        }
                    }
                });
            });
        },

        stop: async function() {
            this.playing = false;
            this.started = false;
            this.player.stopVideo();
        }
    }
}