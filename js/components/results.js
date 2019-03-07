export default {
	data: function() { return({
		scores: Object.values(this.game.players()).sort((a, b) => b.score - a.score),
		attribution: this.game.session().history().map((question) => question.view.attribution)
	})},	
	computed: {
		duration: function() {
			return (this.scores.length + this.attribution.length + 1) * 5;
		}
	},
	props: ['game','sound','avatars'],
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
			this.sound.pause();
			this.$router.push("/");
		}
	}
};
