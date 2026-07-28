<template>
<div>
    <PlayerResults ref="playerResults" :results="results" :minimized="minimizedResults" v-on:completed="minimizeResults" v-on:celebrateVictory="celebrateVictory"/>
    <Credits :scrolling="minimizedResults" :history="history"/>

    <div id="start">
        <a v-on:click="restart"><i class="fas fa-fw fa-redo"></i></a>
    </div>
</div>
</template>

<script>
import Credits from "./Credits.vue";
import PlayerResults from "./PlayerResults.vue";

export default {
  components: {PlayerResults, Credits},
	data: function() {
		return {
			minimizedResults: false
		}
	},
	props: ['gameId', 'results', 'history', 'sound'],
	methods: {
		restart: function() {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
		},
    celebrateVictory: function() {
      this.sound.celebrateVictory();
    },
    minimizeResults: function() {
      this.minimizedResults = true;
    }
	},
	mounted: function() {
		if (!this.results && !this.history) {
			this.$router.push({ path: "/", query : { gameId: this.gameId } });
		}
    this.$refs.playerResults.showScores();
	}
};
</script>

