<template>
	<transition-group name="playerposition" tag="ul" class="playerlist">
		<li v-for="player in players" :key="player.id" :class="{'guessed' : player.guessed, 'score-change-positive': player.achievedPoints, 'score-change-negative': player.lostPoints}">
			<img src="../../../img/crown.png" class="leader" v-if="isLeadingPlayer(player)" alt=""/>
			<Avatar :score="playerNameOrPoints(player)" :multiplier="player.multiplier" :color="player.color" :avatar="player.avatarOrIcon"/>
		</li>
	</transition-group>
</template>

<script>
import Avatar from "../Avatar.vue";

class PlayerData {
	constructor(id, player) {
		this.id = id;
		this.name = player.name;
		this.color = player.color;
		this.avatar = player.avatar;
		this.totalPoints = 0;
		this.pointChange = 0;
		this.multiplier = 1;
		this.guessed = false;
		this.connected = true;
	}

	updatePoints(pointChanges) {
		this.pointChange = pointChanges.points;
		this.multiplier += pointChanges.multiplier;
		this.guessed = false;
		this.totalPoints += pointChanges.points;
	}

	clearChanges() {
		this.pointChange = 0;
	}

	get avatarOrIcon() {
		if (this.connected && !this.hidden) {
			return this.avatar;
		} else if (this.connected && this.hidden) {
			return 'fa-question';
		} else {
			return 'fa-bolt';
		}
	}

	get achievedPoints() {
		return this.pointChange > 0;
	}

	get lostPoints() {
		return this.pointChange < 0;
	}
}

export default {
	components: {Avatar},
	data: function () {
		return {
			showNames: false,
			showNamesInterval: 0,
			players: []
		}
	},
	props: ['lobbyPlayers', 'hidden'],
	emits: ['maxMultiplierLost', 'allGuessedCorrect'],
	methods: {
		isLeadingPlayer(player) {
			let playerScoreCount = this.players.filter((p) => p.totalPoints >= player.totalPoints).length;
			return playerScoreCount === 1;
		},

		playerNameOrPoints(player) {
			if (player.achievedPoints || player.lostPoints) {
				return player.pointChange;
			}
			if (this.hidden) {
				return "???";
			}
			if (this.showNames) {
				return player.name;
			}
			return player.totalPoints;
		},

		async showGuesses(pointsThisRound) {
			let maxMultiplierChanged = Math.min(...Object.values(pointsThisRound).map(p => p.multiplier));
			let allGuessedCorrect = Object.values(pointsThisRound).filter(p => p.points > 0).length === this.players.length;

			if (allGuessedCorrect) {
				this.$emit('allGuessedCorrect');
			}

			if (maxMultiplierChanged < 0) {
				this.$emit('maxMultiplierLost', maxMultiplierChanged);
			}

			this.players.forEach(player => {
				player.updatePoints(pointsThisRound[player.id]);
			});

			await new Promise(resolve => setTimeout(resolve, 2000));

			this.players.forEach((player) => player.clearChanges());
			this.players.sort((a, b) => b.totalPoints - a.totalPoints);
		},

		playerGuessed(id) {
			this.players.find(p => p.id === id).guessed = true;
			return this.players.filter((p) => p.guessed).length;
		},

		playersConnected(newPlayers) {
			this.players.forEach(player => {
				player.connected = player.id in newPlayers;
			});
		}
	},
	mounted() {
		this.showNamesInterval = setInterval(() => {
			this.showNames = !this.showNames;
		}, 5000);
		this.players = Object.entries(this.lobbyPlayers).map(entry => new PlayerData(entry[0], entry[1]));
	},

	unmounted: function () {
		clearInterval(this.showNamesInterval);
	}
}
</script>