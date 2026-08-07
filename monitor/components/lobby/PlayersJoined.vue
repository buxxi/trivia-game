<template>
	<div class="players">
		<h1><i class="fas fa-fw fa-users"></i>{{ $t('players.header') }}</h1>
		<p v-if="Object.entries(players).length === 0">{{ $t('players.none') }}</p>
		<ul class="playerlist" v-if="Object.entries(players).length > 0">
			<li v-for="(player, id) in players" v-on:click="kickPlayer(id)" :title="$t('players.kick')">
				<Avatar :ping="pings[id]" :score="player.name" :color="player.color" :avatar="player.avatar"/>
			</li>
		</ul>
	</div>
</template>

<script>
import Avatar from "../../../common/components/Avatar.vue";

export default {
	components: {Avatar},
	props: ['players', 'pings'],
	emits: ['playerKicked'],
	methods: {
		kickPlayer: function (playerId) {
			this.$emit('playerKicked', playerId);
		}
	}
}
</script>

<style lang="scss">

.playerlist {
	li {
		&:hover {
			cursor: not-allowed;
			opacity : 0.5;
		}
	}
}
</style>

