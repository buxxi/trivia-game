<template>
	<transition-group tag="ul" v-if="categories.length !== 0" :class="{'spinner' : true, 'highlight' : done}" :style="{'transition-duration' : duration + 'ms'}">
		<li v-for="cat in categories" :key="cat.index" @transitionstart="transitionStart" @transitionend="transitionEnd">
			<CategoryIcon :icon="cat.icon"/>
			<span class="text">{{ cat.name }}</span>
		</li>
	</transition-group>
</template>

<script>
import logger from '../../../../common/js/browser-logger.mjs';
import CategoryIcon from "../CategoryIcon.vue";

const MIN_SPINS = 15;
const RAMPDOWN_DURATIONS = [75, 100, 125, 175, 225, 300, 400, 600, 900, 1500];
const NORMAL_DURATION = 50;

class TransitionCounter {
	constructor() {
		this._count = 0;
		this._promise = new Promise((resolve, _) => {
			this._resolvePromise = resolve;
		});
	}

	wait() {
		return this._promise;
	}

	countUp() {
		this._count++;
	}

	countDown() {
		this._count--;
		if (this._count <= 0) {
			this._resolvePromise();
		}
	}
}

export default {
	components: {CategoryIcon},
	data: function () {
		return {
			duration: NORMAL_DURATION,
			done: false,
			stepsLeft: -1,
			totalSteps: -1,
			categories: []
		}
	},
	methods: {
		async start(categories, correct) {
			this.categories = categories.map((category, index) => Object.assign({index, ...category}));
			this.totalSteps = this._calculateSteps(correct);
			this.stepsLeft = this.totalSteps;

			await this.$nextTick();

			while (!this.done) {
				this.done = await this.flip();
			}
		},

		async flip() {
			this.$emit('flip');

			this.duration = this._calculateDuration();

			try {
				if (this.stepsLeft > 0) {
					this.transitionCounter = new TransitionCounter();
					this.categories.unshift(this.categories.pop());
					this.stepsLeft--;

					await this.$nextTick();
					await Promise.race([this.transitionCounter.wait(), this._detectStuck()]);
					await this.$nextTick();

					return false;
				}
			} catch (ex) {
				logger.error(ex);
				this.duration = 0;
				while (this.stepsLeft > 0) {
					this.categories.unshift(this.categories.pop());
					this.stepsLeft--;
				}
				await this.$nextTick();
			}

			return true;
		},

		transitionStart(event) {
			if (event.propertyName === 'transform') {
				this.transitionCounter.countUp();
			}
		},

		transitionEnd(event) {
			if (event.propertyName === 'transform') {
				this.transitionCounter.countDown();
			}
		},

		_detectStuck() {
			return new Promise((_, reject) => {
				let checkDuration = this.duration * 2;
				if (checkDuration < 250) {
					checkDuration = 500;
				}
				setTimeout(() => {
					reject(new Error("Spinner seems to be stuck"));
				}, checkDuration);
			});
		},

		_calculateSteps(correct) {
			let max_spins = this.categories.length + MIN_SPINS - 1;
			let indexesOfChosen = this.categories.map((current, index) => {
				if (current.name === correct.name) {
					return index;
				} else {
					return -1;
				}
			}).filter(index => index > -1);

			// Make it possible to spin zero or two complete laps, will be filtered out later if it's too much
			let possibleLaps = [0, 1];

			// Multiply each lap with the amount of categories for each index and make sure it's in the range of the minimum and maximum
			let possibleSpins = indexesOfChosen.flatMap(index => {
				return possibleLaps.map(laps => (laps * this.categories.length) + (this.categories.length - index + 3));
			}).filter(spins => spins >= MIN_SPINS && spins <= max_spins);

			return possibleSpins[(possibleSpins.length * Math.random() << 0)];
		},

		_calculateDuration() {
			if (this.stepsLeft < RAMPDOWN_DURATIONS.length) {
				return RAMPDOWN_DURATIONS[RAMPDOWN_DURATIONS.length - this.stepsLeft];
			}
			return NORMAL_DURATION;
		}
	}
}
</script>

<style lang="scss">
@use "sass:color";
@use "../../../../common/css/colors.scss" as triviacolors;

.spinner {
	position: relative;
	height: 9.4em;
	padding: 0;
	display: block;
	text-align: center;
	margin: 0;
	font-size: 3em;
	top: 50%;
	transform: translateY(-50%);

	&:before {
		content: "\f04b";
		font-family: 'Font Awesome 7 Free';
		font-size: 3em;
		display: block;
		position: absolute;
		top: 50%;
		margin-top: -0.5em;
		margin-left: -0.15em;
		z-index: 6;
	}

	li {
		list-style: none;
		height: 3em;
		position: absolute;
		line-height: 3em;
		transition-duration: inherit;
		transition-timing-function: linear;
		transition-property: color, background-color, transform;
		width: 100%;
		white-space: nowrap;
		overflow: hidden;

		img, i {
			margin-right: 0.5em;
		}

		img {
			height: 1em;
			width: 1em;
			filter: grayscale(100%) contrast(1000%) invert(100%);
			mix-blend-mode: screen;
			vertical-align: sub;
		}
	}

	li:nth-child(1) {
		transform: translateY(-1.5em) rotateX(-90deg);
		color: color.adjust(triviacolors.$font, $lightness: -75%, $space: hsl);
		background-color: triviacolors.$primary_border;
		z-index: 2;

	}

	li:nth-child(2) {
		transform: translateY(-1em) rotateX(-70deg);
		color: color.adjust(triviacolors.$font, $lightness: -50%, $space: hsl);
		background-color: color.mix(triviacolors.$primary, triviacolors.$primary_border, $weight: 25%);
		z-index: 3;
	}

	li:nth-child(3) {
		transform: translateY(0.6em) rotateX(-40deg);
		color: color.adjust(triviacolors.$font, $lightness: -25%, $space: hsl);
		background-color: color.mix(triviacolors.$primary, triviacolors.$primary_border, $weight: 50%);
		z-index: 4;
	}

	li:nth-child(4) {
		transform: translateY(3.2em) rotateX(0deg);
		color: triviacolors.$font;
		background-color: triviacolors.$primary;
		z-index: 5;
	}

	li:nth-child(5) {
		transform: translateY(5.8em) rotateX(40deg);
		color: color.adjust(triviacolors.$font, $lightness: -25%, $space: hsl);
		background-color: color.mix(triviacolors.$primary, triviacolors.$primary_border, $weight: 50%);
		z-index: 4;
	}

	li:nth-child(6) {
		transform: translateY(7.4em) rotateX(70deg);
		color: color.adjust(triviacolors.$font, $lightness: -50%, $space: hsl);
		background-color: color.mix(triviacolors.$primary, triviacolors.$primary_border, $weight: 25%);
		z-index: 3;
	}

	li:nth-child(7) {
		transform: translateY(7.9em) rotateX(90deg);
		color: color.adjust(triviacolors.$font, $lightness: -75%, $space: hsl);
		background-color: triviacolors.$primary_border;
		z-index: 2;
	}

	li:nth-child(n+8) {
		transform: translateY(3.2em) rotateX(180deg);
		background-color: triviacolors.$primary_border;
		z-index: 1;
		transition-duration: 0s;
	}

	&.highlight li:nth-child(4) {
		background-color: triviacolors.$correct !important;
		transition-duration: 0.1s !important;

		span {
			transition: font-size 0.5s linear;
			font-size: 1.75em;
		}
	}
}
</style>