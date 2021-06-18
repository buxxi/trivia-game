export default {
    data: function() { return {
        pauseMusic: false,
        minimizeQuestion: true,
    }},
    props: ['view'],
    computed: {
        answers: function() {
            return this.view.answers;
        }
    },
    methods: {
        start: async function() {},
        
        stop: async function() {}
    }
}