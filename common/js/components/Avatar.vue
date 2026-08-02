<template>
	<div class="avatar" :style="{'background-color': color, 'border-color': color}" :data-score="score" :data-multiplier="multiplier" :data-ping="ping">
		<img v-if="!isIcon" :src="src" alt=""/>
		<i v-if="isIcon" :class="['fa-solid', avatar]"></i>
	</div>
</template>

<script>
import avatars from '../avatars.mjs';
let urls = {};
for (const avatar of avatars) {
	urls[avatar] = new URL(`../../img/avatars/${avatar}.png`, import.meta.url).href;
}

export default {
	props: ['color', 'score', 'avatar', 'multiplier', 'ping'],

	computed: {
		src() {
			return urls[this.avatar];
		},

		isIcon() {
			return this.avatar.startsWith('fa-');
		}
	}
}
</script>

<style lang="scss">
@use "../../css/colors" as triviacolors;
.avatar {
	border-radius: 5em;
	display: inline-block;
	overflow: hidden;
	padding: 0.9em;
	img {
		height: 4em;
		width: 4em;
	}

	&[data-multiplier]::before {
		background-color : inherit;
		border-radius: 2em;
		color: triviacolors.$font;
		content: attr(data-multiplier) "x";
		font-weight: bold;
		margin-left: -1em;
		margin-top: -0.8em;
		padding: 0.25em;
		position: absolute;
		text-align : center;
		text-shadow: 0 0 0.2em black;
		width: 1.2em;
	}

	&[data-score]::after {
		background-color : triviacolors.$secondary;
		border-color : inherit;
		border-style : solid;
		border-width : 0.25em;
		border-radius: 0.5em;
		color: triviacolors.$primary;
		content: attr(data-score);
		display: block;
		font-weight: bold;
		margin-left: -1em;
		margin-top: -0.25em;
		overflow : hidden;
		position: absolute;
		text-align: center;
		width: 5.5em;
	}

	&[data-ping]:hover:after {
		content: "ping " attr(data-ping) "ms";
	}

	i {
		display : inline-block;
		width : 1em;
		font-size: 3em;
		padding : 0.2em;
	}

	.guessed & {
		img:first-of-type {
			filter: invert(100%);
		}
		&::after {
			background-color : triviacolors.$primary;
			color : triviacolors.$font;
		}
	}
}
</style>