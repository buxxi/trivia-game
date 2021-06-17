export default {
    data: function() { return {
        pauseMusic: false,
        minimizeQuestion: true,
        playing: false
    }},
    props: ['quote'],
    methods: {
        start: async function() {
            this.playing = true;
        },

        stop: async function() {
            this.playing = false;
        }
    }
}