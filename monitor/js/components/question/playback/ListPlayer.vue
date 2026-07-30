<template>
	<div class="list" id="player">
		<ol v-if="playing">
			<li v-for="item in list">{{ item }}</li>
		</ol>
	</div>
</template>

<script>
export default {
	data: function () {
		return {
			pauseMusic: false,
			minimizeQuestion: true,
			playing: false,
			list : []
		}
	},
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

