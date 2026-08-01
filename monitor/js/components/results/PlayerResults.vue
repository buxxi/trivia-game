<template>
	<div id="results" :class="resultsClass">
		<div class="top-3">
			<div v-for="(score, index) in scores.slice(0, 3)" :class="podiumClass(index)">
				<div class="avatar-wrapper">
					<Avatar :score="score.name" :color="score.color" :avatar="score.avatar"/>
				</div>
				<div class="podium">
					<span class="place">{{ index + 1 }}</span>
					<span class="score" :style="'--total-count:' + score.score"></span>
				</div>
				<div class="summary">
					<span class="correct" :style="'--total-count:' + score.correct"><i class="fas fa-fw fa-check"></i></span>
					<span class="failed" :style="'--total-count:' + score.wrong"><i class="fas fa-fw fa-times"></i></span>
				</div>
			</div>
		</div>
		<div class="others">
			<div v-for="(score, index) in scores.slice(3)" :class="loserClass(index + 3)">
				<span class="place">{{ $t('credits.place', {count: index + 4}) }}</span>
				<div>
					<Avatar :score="score.name" :color="score.color" :avatar="score.avatar"/>
				</div>
				<span class="score" :style="'--total-count:' + score.score"></span>
				<div class="summary">
					<span class="correct" :style="'--total-count:' + score.correct"><i class="fas fa-fw fa-check"></i></span>
					<span class="failed" :style="'--total-count:' + score.wrong"><i class="fas fa-fw fa-times"></i></span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Avatar from "../Avatar.vue";

export default {
	components: {Avatar},
	data: function () {
		return {
			showPlaceAbove: 0,
			celebrate: false
		}
	},
	props: ['results', 'minimized'],
	emits: ['celebrateVictory'],

	computed: {
		resultsClass() {
			return this.minimized ? 'minimize' : '';
		},

		scores() {
			if (!this.results) {
				return [];
			}
			return Object.values(this.results).sort((a, b) => b.score - a.score);
		}
	},

	methods: {
		podiumClass(index) {
			let classList = ['medalist'];
			classList.push(['gold', 'silver', 'bronze'][index]);
			if (index >= this.showPlaceAbove) {
				classList.push('show');
			}
			if (index === 0 && this.celebrate) {
				classList.push('celebrate');
			}
			return classList;
		},

		loserClass(index) {
			let classList = ['loser'];
			if (index >= this.showPlaceAbove) {
				classList.push('show');
			}
			return classList;
		},

		async revealAllScores() {
			while (await this.revealNextScore()) {
				//Wait until all scores revealed
			}
			this._celebrateVictory();
		},

		revealNextScore() {
			return new Promise((resolve, _) => {
				this.showPlaceAbove--;
				setTimeout(() => resolve(this.showPlaceAbove > 0), 1000);
			});
		},

		_celebrateVictory() {
			this.celebrate = true;
			this.$emit('celebrateVictory');
		}
	},

	created() {
		this.showPlaceAbove = this.scores.length;
	}
}
</script>

<style lang="scss">
@use "../../../../common/css/colors.scss" as triviacolors;
@use "sass:color";
@use "sass:math";

$results_slide_duration: 3s;
$gold_glimmer_duration: 4s;
$jump_duration: 1s;
$reveal_duration: 1s;

@mixin podium($color, $height) {
	background: triviacolors.$secondary;
	width: 3.5em;
	font-size: 2.5em;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: center;
	padding: 0.1em;
	color: $color;
	height: $height;
	border-top: 0.25em solid $color;

	.place {
		font-weight: 900;
		font-size: 1.25em;
		-webkit-text-stroke: 0.05em color.adjust($color, $lightness: -10%);
	}

	.score {
		-webkit-text-stroke: 2px color.adjust($color, $lightness: -10%);
		font-size: 0.75em;
		display: inline-block;
		&:after {
			content: "-";
		}
	}
}

@mixin summary-icon($icon_color, $text_color) {
	color: $text_color;
	i {
		color: $icon_color;
		-webkit-text-stroke: 0.2em $icon_color;
		font-size: 0.5em;
		position: relative;
		top: -0.25em;
		padding-right: 0.25em;
	}
	&:after {
		content: "-";
	}
}


#results {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	font-size: 1em;
	transition: left $results_slide_duration linear, font-size $results_slide_duration linear;

	&.minimize {
		left: 50%;
		font-size: 0.8em;
	}

	.top-3 {
		display: flex;
		flex-direction: row;
		font-size: 2em;
		align-items: flex-end;
		justify-content: center;
		margin-top: 3em;

		.avatar {
			font-size: 0.75em;
		}

		.silver {
			order: 1;

			.podium {
				border-top-left-radius: 0.25em;
				@include podium(triviacolors.$second_place, 2.5em);

				.place {
					font-size: 1.5em;
				}
			}
		}

		.gold {
			order: 2;

			.podium {
				@include podium(triviacolors.$first_place, 3em);
				border-top-left-radius: 0.25em;
				border-top-right-radius: 0.25em;

				.place {
					font-size: 2em;
					animation: gold $gold_glimmer_duration linear infinite;
				}
			}

			&.celebrate .avatar-wrapper {
				animation: jump $jump_duration ease-in-out infinite;
			}
		}

		.bronze {
			order: 3;

			.podium {
				@include podium(triviacolors.$third_place, 2em);
				border-top-right-radius: 0.25em;
			}
		}

		.medalist {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
	}

	.others {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;

		.loser {
			display: flex;
			flex-direction: column;
			justify-content: center;
			margin: 1.5em;
			align-items: center;
			width: 9em;
		}

		.place {
			font-size: 3em;
		}

		.score {
			width: 100%;
			font-size: 2.5em;
			background: triviacolors.$secondary;
			border-top: 0.25em solid triviacolors.$primary;
			border-top-left-radius: 0.25em;
			border-top-right-radius: 0.25em;
			color: triviacolors.$primary_border;
			text-align: center;

			&:after {
				content: "-";
			}
		}
	}

	.avatar {
		opacity: 0;
	}

	.show .score:after, .show .correct:after, .show .failed:after {
		--counter: var(--total-count);
		animation: counter-increase $reveal_duration ease-out;
		counter-reset: counter var(--counter);
		content: counter(counter) !important;
	}

	.show .avatar {
		opacity: 1;
		animation: rotate-avatar $reveal_duration ease-out;

		&:after {
			animation: reveal-name $reveal_duration ease-out;
		}
	}

	.summary {
		width: calc(100% - 1em);
		display: flex;
		flex-direction: row;
		padding: 0.25em 0.5em;
		background: triviacolors.$font;
		color: triviacolors.$primary_border;
		justify-content: space-around;
		white-space: nowrap;

		span {
			font-size: 2em;
		}

		.correct {
			@include summary-icon(triviacolors.$correct, triviacolors.$correct_border);
		}

		.failed {
			@include summary-icon(triviacolors.$incorrect, triviacolors.$incorrect_border);
		}
	}
}

@keyframes gold {
	0% { text-shadow: 0 0 0.1em triviacolors.$secondary; -webkit-text-stroke: 0.05em color.adjust(triviacolors.$first_place, $lightness: -10%); }
	50% { text-shadow : 0 0 0.75em triviacolors.$first_place; -webkit-text-stroke: 0.05em triviacolors.$first_place; }
	100% { text-shadow: 0 0 0.1em triviacolors.$secondary; -webkit-text-stroke: 0.05em color.adjust(triviacolors.$first_place, $lightness: -10%); }
}

@keyframes counter-increase {
	@for $i from 0 through 100 {
		#{math.round($i * 1%)} {
			--counter: calc(var(--total-count) * #{$i} / 100);
		}
	}
}

@keyframes rotate-avatar {
	0% { transform: rotateY(0deg) scale(0) }
	25% { transform: rotateY(360deg) scale(0.25) }
	50% { transform: rotateY(720deg) scale(0.5) }
	75% { transform: rotateY(900deg) scale(0.75) }
	100% { transform: rotateY(1080deg) scale(1) }
}

@keyframes jump {
	0% { transform: translateY(0) scaleY(75%) scaleX(100%) }
	10% { transform: translateY(0) scaleY(100%) scaleX(75%) }
	50% { transform: translateY(-50%) scaleY(100%) scaleX(75%) }
	80% { transform: translateY(0) scaleY(100%) scaleX(100%) }
	100% { transform: translateY(0) scaleY(100%) scaleX(100%) }
}

@keyframes reveal-name {
	0% { opacity: 0; }
	99% { opacity: 0; }
	100% { opacity: 1; }
}

</style>