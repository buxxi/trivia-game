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
		}
	},
	props: ['gameId', 'results', 'history'],
	methods: {
		ordinal : function(index) {
			if (((index / 10) % 10) == 1) {
				return "th";
			}
			switch (index % 10) {
				case 1:
					return "st";
				case 2:
					return "nd";
				case 3:
					return "rd";
				default:
					return "th";
			}
		},
		domain : function(link) {
			return new URL(link).hostname;
		},
		restart : function() {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
		}
	},
	created: function() {
		if (!this.results && !this.history) {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
			return;
		}
	}
};
