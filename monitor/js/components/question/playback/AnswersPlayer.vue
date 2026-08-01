<template>
	<div class="list-answers" id="player">
		<ol v-if="playing">
			<AnswerButton v-for="answer in ['A', 'B', 'C', 'D']" tag="li" :answer="answer">
				{{ answers[answer] }}
			</AnswerButton>
		</ol>
	</div>
</template>

<script>
import BlankPlayer from "./BlankPlayer.vue";
import AnswerButton from "../../../../../common/js/components/AnswerButton.vue";

export default {
	components: {AnswerButton},
	data: function () {
		return {
			minimizeQuestion: true,
			playing: false,
			answers: {}
		}
	},
	extends: BlankPlayer,
	methods: {
		async start(_, answers) {
			this.answers = answers;
			this.playing = true;
		},

		async stop() {
			this.answers = {};
			this.playing = false;
		}
	}
}
</script>

<style lang="scss">
#player.list-answers ol {
	font-size: 2em;

	li {
		margin-bottom: 2em;
		line-height: 2em;

		&:before {
			margin-left: -4em;
			padding: 1em;
			font-size: 0.75em;
		}
	}
}
</style>

