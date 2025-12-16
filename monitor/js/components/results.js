export default {
	computed: {
		duration: function() {
			if (!this.history || !this.history) {
				return 0;
			}
			return (this.scores.length + this.history.length + 2) * 5;
		},

		scores: function() {
			if (!this.results) {
				return [];
			}
			return Object.values(this.results).sort((a, b) => b.score - a.score);
		},

		attribution: function() {
			if (!this.history) {
				return [];
			}
			return this.history.map((question) => question.view.attribution);
		},

		resultsClass: function() {
			return this.minimizedResults ? 'minimize' : '';
		},

		creditsClass: function() {
			return this.minimizedResults ? 'scrolling' : '';
		}
	},
	data: function() {
		return {
			showPlaceAbove: 0,
			celebrate: false,
			minimizedResults: false
		}
	},
	props: ['gameId', 'results', 'history', 'sound'],
	methods: {
		domain : function(link) {
			try {
				return new URL(link).hostname;
			} catch (e) {
				return link;
			}
		},
		restart : function() {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
		},
		formatTime : function(time) {
			if (!time) {
				return "-";
			} else {
				return time.toFixed(2) + "s";
			}
		},
		podiumClass: function(index) {
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

		loserClass: function(index) {
			let classList = ['loser'];
			if (index >= this.showPlaceAbove) {
				classList.push('show');
			}
			return classList;
		},

		showNextScore() {
			this.showPlaceAbove--;
			if (this.showPlaceAbove > 0) {
				setTimeout(() => this.showNextScore(), 1000)
			} else {
				setTimeout(() => this.celebrateVictory(), 1000);
				setTimeout(() => this.minimizeResults(), 5000);
			}
		},

		celebrateVictory() {
			this.celebrate = true;
			this.sound.applauds();
		},

		minimizeResults: function() {
			this.minimizedResults = true;
		}
	},
	created: function() {
		if (!this.results && !this.history) {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
			return;
		}
		this.showPlaceAbove = this.scores.length;
		this.showNextScore();
	}
};
