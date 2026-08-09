<template>
	<div v-if="questionIndex" id="round" :data-round="$t('states.question', {index:questionIndex})" @animationend="animationEnd"></div>
</template>

<script>
export default {
	data: function() {
		return {
			questionIndex: undefined,
		}
	},
	methods: {
		show(questionIndex) {
			this.questionIndex = questionIndex;
		},

		animationEnd() {
			this.questionIndex = undefined;
		}
	}
}
</script>

<style lang="scss">
@use "../../../common/css/colors" as triviacolors;

#round {
	position: fixed;
	background-color: triviacolors.$primary_border;
	left: 0;
	top: 40%;
	width: 100%;
	z-index: 2;
	font-size: 10em;
	bottom: 40%;
	border-style: solid;
	border-width: 5px 0;
	border-color: triviacolors.$primary;
	box-shadow: 0 0 50px triviacolors.$primary;
	opacity: 0;
	animation: round 3s linear;

	&:before {
		content: attr(data-round);
		-webkit-background-clip: text;
		background-clip: text;
		color: rgba(0, 0, 0, 0);
		position: absolute;
		top: 0.1em;
		left: 0;
		width: 100%;
		text-align: center;
		background-image: linear-gradient(triviacolors.$font 55%, rgba(0, 0, 0, 0) 0%);
		animation: round-from-left 3s linear;
	}

	&:after {
		content: attr(data-round);
		-webkit-background-clip: text;
		background-clip: text;
		color: rgba(0, 0, 0, 0);
		position: absolute;
		top: 0.1em;
		left: 0;
		width: 100%;
		text-align: center;
		background-image: linear-gradient(rgba(0, 0, 0, 0) 55%, triviacolors.$font 0%);
		animation: round-from-right 3s linear;
	}
}

@keyframes round {
	0% {
		opacity: 0
	}
	10% {
		opacity: 1
	}
	70% {
		opacity: 1
	}
	80% {
		opacity: 0
	}
}

@keyframes round-from-left {
	0% {
		margin-left: -150vw
	}
	20% {
		margin-left: 0
	}
	70% {
		margin-left: 0
	}
	100% {
		margin-left: 150vw
	}
}

@keyframes round-from-right {
	0% {
		margin-left: 150vw
	}
	20% {
		margin-left: 0
	}
	70% {
		margin-left: 0
	}
	100% {
		margin-left: -150vw
	}
}
</style>