export default {
    data: function() { return {
        player: {},
        pauseMusic: true,
        minimizeQuestion: true,
        timeout: 0
    }},
    props: ['view'],
    computed: {
        src: function() {
            return this.view.url;
        }
    },
    methods: {
        start: async function() {
            let self = this;
            self.timeout = -1;
        
            return new Promise(async (resolve, reject) => {
                self.player = WaveSurfer.create({
                    container: '#player',
                    waveColor: 'white',
                    progressColor: '#337ab7',
                    cursorColor : '#133451',
                    cursorWidth : 3,
                    barWidth : 6,
                    barRadius : 3,
                    barGap: 3,
                    height: 256
                });

                self.player.on('ready', () => {
                    self.player.setVolume(0.3);
                    self.player.play();
                    resolve();
                });

                self.player.on('finish', () => {
                    self.timeout = setTimeout(() => self.player.play(), 500);
                });

                try {
                    await self.player.load(self.src);
                } catch (e) {
                    reject(new Error(e + ": " + self.src));
                }
            });
        },
        
        stop: async function() {
            if (self.timeout) {
                clearTimeout(self.timeout);
            }
            this.player.stop();
            this.player.destroy();
        }
    }
}