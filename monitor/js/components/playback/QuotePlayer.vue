<template>
<div class="quote" id="player">
    <i class="fas fa-fw fa-quote-left" v-if="playing"></i>
    <p v-if="playing">{{ quote }}</p>
    <i class="fas fa-fw fa-quote-right" v-if="playing"></i>
</div>
</template>

<script>
export default {
    data: function() { return {
        pauseMusic: false,
        minimizeQuestion: true,
        playing: false
    }},
    props: ['view'],
    computed: {
        quote: function() {
            return this.view.quote;
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
</script>

