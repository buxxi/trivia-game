<template>
<div class="list-answers" id="player">
    <ol v-if="playing">
        <li class="button-icon-A">{{ answers.A }}</li>
        <li class="button-icon-B">{{ answers.B }}</li>
        <li class="button-icon-C">{{ answers.C }}</li>
        <li class="button-icon-D">{{ answers.D }}</li>
	</ol>
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
</script>

