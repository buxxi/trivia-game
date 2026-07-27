<template>
  <div class="players">
    <h1><i class="fas fa-fw fa-users"></i>{{ $t('players.header') }}</h1>
    <p v-if="Object.entries(players).length === 0">{{ $t('players.none')}}</p>
    <ul class="playerlist" v-if="Object.entries(players).length > 0">
      <li v-for="(player, id) in players">
        <a v-on:click="kickPlayer(id)" class="kick" v-bind:title="$t('players.kick')">
          <div class="avatar" v-bind:data-ping="pings[id]" v-bind:data-score="player.name" v-bind:style="{'background-color': player.color, 'border-color': player.color}">
            <img v-bind:src="'../common/img/avatars/' + player.avatar + '.png'" alt=""/>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ['players', 'pings'],
  emits: ['playerKicked'],
  methods: {
    kickPlayer: function(playerId) {
      this.$emit('playerKicked', playerId);
    }
  }
}
</script>

