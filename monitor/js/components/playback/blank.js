export default {
    data: function() { return {
		pauseMusic: false,
		minimizeQuestion: false,
        playing: false
    }},
    methods: {
        start: async function() {
            this.playing = true;
        },
        
        stop: async function() {
            this.playing = false;
        }
    }
}