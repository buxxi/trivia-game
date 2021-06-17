export default {
    data: function() { return {
        player: {},
        pauseMusic: true,
        minimizeQuestion: true,
        playing: false,
        started: false
    }},
    props: ['mp3'],
    methods: {
        start: async function() {
            let self = this;
            
            this.started = true;
            await this.$nextTick();
        
            return new Promise((resolve, reject) => {
                self.player = WaveSurfer.create({
                    container: '#player',
                    waveColor: 'white',
                    progressColor: '#337ab7',
                    cursorColor : '#133451',
                    cursorWidth : 3,
                    barWidth : 3
                });
    
                self.player.on('ready', () => {
                    self.player.setVolume(0.3);
                    self.player.play();
                    self.playing = true;
                    resolve();
                });
    
                self.player.on('error', (err) => {
                    reject(new Error(err + ": " + self.mp3));
                });
    
                self.player.load(self.mp3);
            });
        },
        
        stop: async function() {
            this.player.stop();
            this.player.destroy();
            this.playing = false;
            this.started = true;
        }
    }
}