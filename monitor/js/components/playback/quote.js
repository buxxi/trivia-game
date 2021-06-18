export default {
    data: function() { return {
        pauseMusic: false,
        minimizeQuestion: true
    }},
    props: ['view'],
    computed: {
        quote: function() {
            return this.view.quote;
        }
    },
    methods: {
        start: async function() {},

        stop: async function() {}
    }
}