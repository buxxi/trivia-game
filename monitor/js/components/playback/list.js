export default {
    data: function() { return {
        pauseMusic: false,
        minimizeQuestion: true
    }},
    props: ['view'],
    computed: {
        list: function() {
            return this.view.list;
        }
    },
    methods: {
        start: async function() {},

        stop: async function() {}
    }
}