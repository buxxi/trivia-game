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