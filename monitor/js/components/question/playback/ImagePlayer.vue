<template>
	<div class="image" id="player">
		<img v-bind:src="img.src" v-if="playing" alt=""/>
	</div>
</template>

<script>
export default {
	data: function () {
		return {
			player: {},
			pauseMusic: false,
			minimizeQuestion: true,
			playing: false,
			img: undefined
		}
	},
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

