export default {
    data: function() { return {
        player: {},
        pauseMusic: false,
        minimizeQuestion: true,
        playing: false
    }},
    props: ['src'],
    methods: {
        start: async function() {
            let self = this;
            await this.$nextTick();
            
            return new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = () => {
                    self.playing = true;
                    resolve();
                };
                img.onerror = () => {
                    reject(new Error("Could not load image " + self.src));
                };
                console.log(self.src);
                img.src = self.src;
            });
        },

        stop: async function() {
            this.playing = false;
        }
    }
}
