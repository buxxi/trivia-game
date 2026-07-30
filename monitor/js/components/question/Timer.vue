<template>
  <div class="timer" v-if="running" :class="{'timer-warning': warning}">
    <div class="timer-score infobox"><i class="fas fa-fw fa-star"></i>{{ score }}</div>
    <div class="timer-counter" v-bind:data-seconds="timeLeft" v-bind:data-percentage="percentageLeft">
      <svg viewBox="0 0 38 38">
        <circle id="border" r="15.9155" cx="19" cy="19"></circle>
        <circle id="bar" r="15.9155" cx="19" cy="19" stroke-dasharray="100" v-bind:stroke-dashoffset="(100 - percentageLeft )"></circle>
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  data: function() {
    return {
      running: false,
      warning: false,
      score: 0,
      timeLeft: 0,
      percentageLeft: 0
    }
  },

  methods: {
    update(timeLeft, percentageLeft, currentScore) {
      let previousWarning = this.warning;
      this.running = true;
      this.score = currentScore;
      this.timeLeft = timeLeft;
      this.percentageLeft = percentageLeft;
      this.warning = timeLeft <= 5;
      return !previousWarning && this.warning;
    },

    stop() {
      this.running = false;
      this.warning = false;
    }
  }
}
</script>