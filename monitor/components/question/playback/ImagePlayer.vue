<template>
	<div class="image" id="player">
		<img :src="img.src" v-if="playing" alt=""/>
	</div>
</template>

<script>
import BlankPlayer from "./BlankPlayer.vue";

export default {
	data: function () {
		return {
			player: {},
			minimizeQuestion: true,
			playing: false,
			img: undefined
		}
	},
	extends: BlankPlayer,
	methods: {
		async start(view, _) {
			let self = this;

			return new Promise((resolve, reject) => {
				let img = new Image();
				img.onload = () => {
					self.playing = true;
					resolve();
				};
				img.onerror = () => {
					reject(new Error("Could not load image " + view.url));
				};
				img.src = view.url;
				self.img = img;
			});
		},

		async stop() {
			this.img = undefined;
			this.playing = false;
		}
	}
}
</script>

<style lang="scss">
#player.image {
	img {
		max-height: 100%;
		min-height: 30em;
	}
}
</style>