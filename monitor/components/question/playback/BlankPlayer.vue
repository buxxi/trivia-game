<template>
	<div id="player"></div>
</template>

<script>
export default {
	data: function () {
		return {
			pauseMusic: false,
			minimizeQuestion: false
		}
	},
	methods: {
		async start(_, __) {
		},

		async stop(_, __) {
		}
	}
}
</script>

<style lang="scss">
#player {
	display : flex;
	align-items : center;
	justify-content: center;
	height : 100%;
	width : 100%;
}
</style>

