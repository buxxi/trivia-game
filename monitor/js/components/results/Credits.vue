<template>
	<div id="credits" :style="{'animation-duration': duration + 's'}" :class="creditsClass">
		<Attribution v-for="attr in attribution" :title="attr.title" :name="attr.name" :links="attr.links" linkTextTranslationKey="credits.attribution"/>

		<Attribution :title="$t('credits.music.by')" name="Suno" :links="['https://suno.com/s/FnM53Cv3rCqP0xfp']" linkTextTranslationKey="credits.music.suno"/>

		<Attribution :title="$t('credits.game.by')" name="BuXXi" :links="['https://github.com/buxxi/trivia-game']" linkTextTranslationKey="credits.game.source"/>
	</div>
</template>

<script>
import Attribution from "./Attribution.vue";

export default {
	components: {Attribution},
	props: ['scrolling', 'history'],

	computed: {
		duration: function () {
			if (!this.history || !this.history) {
				return 0;
			}
			return (this.history.length + 2) * 5;
		},

		attribution: function () {
			if (!this.history) {
				return [];
			}
			return this.history.map((question) => question.view.attribution);
		},

		creditsClass: function () {
			return this.scrolling ? 'scrolling' : '';
		}
	}
}
</script>

<style lang="scss">
@use "../../../../common/css/colors.scss" as triviacolors;

#credits {
	color: triviacolors.$font;
	position: relative;
	text-align: center;
	width: 50%;
	left: 0;
	top: 100vh;

	&.scrolling {
		animation: 1s scroll linear infinite;

		&:hover {
			animation-play-state: paused;
		}
	}

	.attribution {
		h1 {
			font-size: 4em;
		}

		a {
			color: triviacolors.$primary;
			font-weight: bold;
			text-decoration: none;
		}

		&:hover {
			ul {
				visibility: visible;
			}
		}

		ul {
			list-style: none;
			visibility: hidden;
		}

		span {
			font-size: 6em;
		}
	}

	h2 {
		font-size: 2em;
		text-align: left;
		margin: 0.5em 0;
	}

	& > div {
		height: 50vh;
	}
}

@keyframes scroll {
	0% {
		top: 100vh;
		transform: translateY(0)
	}
	100% {
		top: 0;
		transform: translateY(-100%)
	}
}
</style>