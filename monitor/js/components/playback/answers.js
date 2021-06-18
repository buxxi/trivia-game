export default {
    data: function() { return {
        pauseMusic: false,
        minimizeQuestion: true,
        playing: false
    }},
    props: ['view'],
    computed: {
        answers: function() {
            return this.view.answers;
        }
    },
    methods: {
        start: async function() {
            this.playing = true;
        },

        stop: async function() {
            this.playing = false;
        }
    }
}