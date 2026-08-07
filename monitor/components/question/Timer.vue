<template>
	<div class="timer" v-if="running" :class="{'timer-warning': warning}">
		<div class="timer-score infobox"><i class="fas fa-fw fa-star"></i>{{ score }}</div>
		<div class="timer-counter" :data-seconds="timeLeft" :data-percentage="percentageLeft">
			<svg viewBox="0 0 38 38">
				<circle id="border" r="15.9155" cx="19" cy="19"></circle>
				<circle id="bar" r="15.9155" cx="19" cy="19" stroke-dasharray="100" :stroke-dashoffset="(100 - percentageLeft )"></circle>
			</svg>
		</div>
	</div>
</template>

<script>
export default {
	data: function () {
		return {
			running: false,
			warning: false,
			score: 0,
			timeLeft: 0,
			percentageLeft: 0
		}
	},

	methods: {
		update(timeLeft, percentageLeft, currentScore) {
			let previousWarning = this.warning;
			this.running = true;
			this.score = currentScore;
			this.timeLeft = timeLeft;
			this.percentageLeft = percentageLeft;
			this.warning = timeLeft <= 5;
			return !previousWarning && this.warning;
		},

		stop() {
			this.running = false;
			this.warning = false;
		}
	}
}
</script>

<style lang="scss">
@use "../../../common/css/colors" as triviacolors;

.timer-warning {
	.timer-score {
		color: triviacolors.$incorrect;
	}

	.timer-counter {
		color: triviacolors.$incorrect;

		&:before {
			transform: scale(0.5, 0.5);
			animation: timer-pulse 1s linear infinite;
		}

		svg #bar {
			stroke: triviacolors.$incorrect;
		}
	}

	/*TODO: move this out */
	.question:has(&):before {
		--timer-warning-width: 0em;
		content: "";
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		z-index: -2;
		animation: timer-bg-pulse 1s ease-in-out infinite;
	}
}

.timer-score {
	float: left;
	left: 2em;
	padding: 0.5em 2.5em 0.5em 1em !important;
	position: relative;
}

.timer-counter {
	position: relative;
	width: 4.2em;
	height: 4.2em;
	top: -0.5em;
	float: right;
	color: triviacolors.$primary;

	svg {
		transform: rotate(90deg) scaleX(-1);
		width: 100%;
		height: 100%;

		circle {
			transition: stroke-dashoffset 0.1s linear;
			stroke: triviacolors.$secondary_border;
			stroke-width: 0.25em;
			fill: triviacolors.$secondary;
		}

		#bar {
			stroke: triviacolors.$primary;
			fill: transparent;
		}
	}

	&:before {
		font-size: 2.1em;
		content: attr(data-seconds);
		position: absolute;
		z-index: 2;
		width: 2em;
		line-height: 2em;
		text-align: center;
		display: block;
		transform: scale(0.75);
	}
}

@keyframes timer-pulse {
	0% {
		transform: scale(0.5);
	}
	50% {
		transform: scale(2);
	}
	100% {
		transform: scale(1);
	}
}

@keyframes timer-bg-pulse {
	0% {
		box-shadow: inset 0 0 1em triviacolors.$incorrect;
	}
	50% {
		box-shadow: inset 0 0 15em triviacolors.$incorrect;
	}
	100% {
		box-shadow: inset 0 0 1em triviacolors.$incorrect;
	}
}
</style>