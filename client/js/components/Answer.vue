<template>
  <div class="answer">
    <div class="stats" v-bind:style="{'background-color': stats.color}">
      <img v-bind:src="'../common/img/avatars/' + stats.avatar + '.png'"/>
      <div><i class="fas fa-fw fa-star"></i>{{stats.score}}</div>
      <div><i class="fas fa-fw fa-times"></i>{{stats.multiplier}}</div>
    </div>
    <div v-if="waiting">
      <div class="fa-stack fa-5x">
        <i class="fas fa-tv fa-stack-2x"></i>
        <i class="fas fa-stack-1x" v-bind:class="{'fa-eye' : connected, 'fa-bolt' : !connected}"></i>
      </div>
      <h3>{{ message }}</h3>
      <div class="buttons" v-if="!connected">
        <button v-on:click.prevent="reconnect"><i class="fas fa-fw fa-sync"></i> Reconnect</button>
        <button v-on:click.prevent="returnToLobby"><i class="fas fa-fw fa-sign-out-alt"></i> To lobby</button>
      </div>
    </div>

    <button class="button-icon-A" v-if="!waiting && answers.A" v-on:click.prevent="makeGuess('A')" v-bind:class="buttonClass('A')" v-bind:disabled="hasGuessed">{{ answers.A }}</button>
    <button class="button-icon-B" v-if="!waiting && answers.B" v-on:click.prevent="makeGuess('B')" v-bind:class="buttonClass('B')" v-bind:disabled="hasGuessed">{{ answers.B }}</button>
    <button class="button-icon-C" v-if="!waiting && answers.C" v-on:click.prevent="makeGuess('C')" v-bind:class="buttonClass('C')" v-bind:disabled="hasGuessed">{{ answers.C }}</button>
    <button class="button-icon-D" v-if="!waiting && answers.D" v-on:click.prevent="makeGuess('D')" v-bind:class="buttonClass('D')" v-bind:disabled="hasGuessed">{{ answers.D }}</button>
  </div>
</template>

<script>
function showAnswers(app, answers) {
  app.answers = answers;
  app.waiting = false;
  app.correct = null;
  app.guess = null;
  app.hasGuessed = false;
}

function showCorrect(app, pointsThisRound, correct) {
  app.correct = correct.key;
  app.stats.score += pointsThisRound.points;
  app.stats.multiplier += pointsThisRound.multiplier;

  setTimeout(() => {
    app.answers = {};
    app.waiting = true;
    app.message = 'Waiting for next question';
  }, 2000);
}

function showClosed(app) {
  app.answers = {};
  app.waiting = true;
  app.message = 'The host closed the connection';
  app.connected = false;
}

async function redirectToJoin(app) {
  await app.wakelock.release();
  let gameId = app.clientState.getInProgressGameId();
  app.clientState.clearInProgressGameId();
  app.clientState.clearInProgressClientId();
  app.$router.push({ name: "join", query : { gameId: gameId, preferredAvatar: app.stats.avatar, name: app.stats.name } });
}

export default {
  data: function() { return({
    connected: this.connection.connected(),
    waiting: true,
    hasGuessed: false,
    message: this.connection.connected() ? 'Waiting for the game to start' : 'Not connected',
    answers: {},
    correct: undefined,
    guess: undefined
  })},
  props: ['connection', 'wakelock', 'clientState', 'stats'],
  created: function() {
    if (!this.connection.connected()) {
      return;
    }
    this._registerListeners();
  },
  methods: {
    reconnect: async function() {
      try {
        let data = await this.connection.reconnect(this.clientState.getInProgressGameId(), this.clientState.getInProgressClientId());
        for (let key in data.stats) {
          this.stats[key] = data.stats[key];
        }
        this._registerListeners();
        this.connected = true;
        this.message = 'Waiting for the game to continue';
      } catch (e) {
        this.message = "Error when reconnecting: " + e;
      }
    },

    returnToLobby: function() {
      this.clientState.clearInProgressGameId();
      this.clientState.clearInProgressClientId();
      this.$router.push({ name: "join" });
    },

    makeGuess: async function(answer) {
      try {
        this.hasGuessed = true;
        await this.connection.guess(answer);
        this.guess = answer;
      } catch (e) {
        this.hasGuessed = false;
        this.guess = null;
      }
    },
    buttonClass: function(answer) {
      if (this.correct && this.correct == answer) {
        return "correct";
      } else if (this.correct && answer == this.guess && this.correct != this.guess) {
        return "incorrect";
      } else if (this.correct && this.correct != answer) {
        return "unused"
      } else if (!this.correct && answer == this.guess) {
        return "selected";
      } else if (!this.correct && this.guess) {
        return "unused";
      } else {
        return "";
      }
    },

    _registerListeners: function() {
      this.connection.onQuestionStart().then(async answers => showAnswers(this, answers));
      this.connection.onQuestionEnd().then(async (data) => showCorrect(this, data.pointsThisRound, data.correct));
      this.connection.onClose().catch(() => showClosed(this));
      this.connection.onGameEnd().then(async () => redirectToJoin(this));
    }
  }
};

</script>