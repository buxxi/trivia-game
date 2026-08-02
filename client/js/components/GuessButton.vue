<template>
	<AnswerIcon tag="button" :answer="answer" v-bind="$attrs" :class="buttonClass" :disabled="hasGuessed">
		<slot></slot>
	</AnswerIcon>
</template>

<script>
import AnswerIcon from "../../../common/js/components/AnswerIcon.vue";

export default {
	components: {AnswerIcon},
	props: ['answer', 'correct', 'guess'],
	computed: {
		hasGuessed() {
			return !!this.guess;
		},
		buttonClass: function () {
			if (this.correct && this.correct === this.answer) {
				return "correct";
			} else if (this.correct && this.answer === this.guess && this.correct !== this.guess) {
				return "incorrect";
			} else if (this.correct && this.correct !== this.answer) {
				return "unused"
			} else if (!this.correct && this.answer === this.guess) {
				return "selected";
			} else if (!this.correct && this.guess) {
				return "unused";
			} else {
				return "";
			}
		}
	}
}
</script>

<style lang="scss">
@use "sass:color";
@use "../../../common/css/colors.scss" as triviacolors;

@mixin guess-button($color) {
	background-color: color.adjust($color, $lightness: -20%, $space: hsl);
	border-color: $color;
	width: calc(100% - 1em);
	&.selected {
		background-color: $color;
		border-color: color.adjust($color, $lightness: -20%, $space: hsl);
	}

	&.correct {
		background-color: triviacolors.$correct;
		border-color: triviacolors.$correct_border;
		&:before {
			content: "\f00c";
			font-family: 'Font Awesome 7 Free';
			color: triviacolors.$correct;
			background-color : triviacolors.$correct_border !important;
			border-color : triviacolors.$correct !important;
		}
	}

	&.incorrect {
		background-color: triviacolors.$incorrect;
		border-color: triviacolors.$incorrect_border;
		&:before {
			content: "\f00d";
			font-family: 'Font Awesome 7 Free';
			color: triviacolors.$incorrect;
			background-color : triviacolors.$incorrect_border !important;
			border-color : triviacolors.$incorrect !important;
		}
	}

	&.unused {
		background-color: #AAA;
		border-color: color.adjust(#AAAA, $lightness: -20%, $space: hsl);
	}

	&.selected:before {
		content: "\f023";
		font-family: 'Font Awesome 7 Free';
		background-color: color.adjust($color, $lightness: -20%, $space: hsl);
		margin-left: 0.5em;
	}
}

button.button-icon-A {
	@include guess-button(triviacolors.$A_color);
}

button.button-icon-B {
	@include guess-button(triviacolors.$B_color);
}

button.button-icon-C {
	@include guess-button(triviacolors.$C_color);
}

button.button-icon-D {
	@include guess-button(triviacolors.$D_color);
}
</style>