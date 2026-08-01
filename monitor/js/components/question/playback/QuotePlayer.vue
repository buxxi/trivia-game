<template>
	<div class="quote" id="player">
		<i class="fas fa-fw fa-quote-left" v-if="playing"></i>
		<p v-if="playing">{{ quote }}</p>
		<i class="fas fa-fw fa-quote-right" v-if="playing"></i>
	</div>
</template>

<script>
import BlankPlayer from "./BlankPlayer.vue";

export default {
	data: function () {
		return {
			minimizeQuestion: true,
			playing: false,
			quote: undefined
		}
	},
	extends: BlankPlayer,
	methods: {
		async start(view, _) {
			this.quote = view.quote;
			this.playing = true;
		},

		async stop() {
			this.quote = undefined;
			this.playing = false;
		}
	}
}
</script>

<style lang="scss">
@use "../../../../../common/css/colors.scss" as triviacolors;

#player.quote {
	color: triviacolors.$font;

	.fa-quote-left {
		float: left;
		font-size: 4em;
		left: -1em;
		position: relative;
	}

	p {
		clear: both;
		font-size: 3em;
	}

	.fa-quote-right {
		float: right;
		font-size: 4em;
		position: relative;
		right: -1em;
	}
}
</style>

