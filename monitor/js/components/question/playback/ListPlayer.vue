<template>
	<div class="list" id="player">
		<ol v-if="playing">
			<li v-for="item in list">{{ item }}</li>
		</ol>
	</div>
</template>

<script>
import BlankPlayer from "./BlankPlayer.vue";

export default {
	data: function () {
		return {
			minimizeQuestion: true,
			playing: false,
			list: []
		}
	},
	extends: BlankPlayer,
	methods: {
		async start(view, _) {
			this.list = view.list;
			this.playing = true;
		},

		async stop() {
			this.list = [];
			this.playing = false;
		}
	}
}
</script>

<style lang="scss">
#player.list ol {
	font-size: 2em;
}
</style>

