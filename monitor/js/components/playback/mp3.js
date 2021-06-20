export default {
    data: function() { return {
        player: {},
        pauseMusic: true,
        minimizeQuestion: true
    }},
    props: ['view'],
    computed: {
        src: function() {
            return this.view.mp3;
        }
    },
    methods: {
        start: async function() {
            let self = this;
        
            return new Promise((resolve, reject) => {
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
    
                self.player.on('error', (err) => {
                    reject(new Error(err + ": " + self.src));
                });
    
                self.player.load(self.src);
            });
        },
        
        stop: async function() {
            this.player.stop();
            this.player.destroy();
        }
    }
}