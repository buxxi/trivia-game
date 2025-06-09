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
		}
	},
	created: function() {
		if (!this.results && !this.history) {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
			return;
		}
	}
};
