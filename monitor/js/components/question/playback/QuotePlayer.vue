<template>
	<div class="quote" id="player">
		<i class="fas fa-fw fa-quote-left" v-if="playing"></i>
		<p v-if="playing">{{ quote }}</p>
		<i class="fas fa-fw fa-quote-right" v-if="playing"></i>
	</div>
</template>

<script>
export default {
	data: function () {
		return {
			pauseMusic: false,
			minimizeQuestion: true,
			playing: false,
			quote: undefined
		}
	},
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

