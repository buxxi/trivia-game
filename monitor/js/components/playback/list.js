export default {
    data: function() { return {
        pauseMusic: false,
        minimizeQuestion: true,
        playing: false
    }},
    props: ['view'],
    computed: {
        list: function() {
            return this.view.list;
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