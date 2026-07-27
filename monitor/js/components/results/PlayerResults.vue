<template>
  <div id="results" v-bind:class="resultsClass">
    <div class="top-3">
      <div v-for="(score, index) in scores.slice(0, 3)" v-bind:class="podiumClass(index)">
        <div class="avatar-wrapper">
          <div class="avatar" v-bind:style="{'background-color': score.color, 'border-color': score.color}"  v-bind:data-score="score.name">
            <img v-bind:src="'../common/img/avatars/' + score.avatar + '.png'" alt=""/>
          </div>
        </div>
        <div class="podium">
          <span class="place">{{ index + 1}}</span>
          <span class="score" v-bind:style="'--total-count:' + score.score"></span>
        </div>
        <div class="summary">
          <span class="correct" v-bind:style="'--total-count:' + score.correct"><i class="fas fa-fw fa-check"></i></span>
          <span class="failed" v-bind:style="'--total-count:' + score.wrong"><i class="fas fa-fw fa-times"></i></span>
        </div>
      </div>
    </div>
    <div class="others">
      <div v-for="(score, index) in scores.slice(3)" v-bind:class="loserClass(index + 3)">
        <span class="place">{{ $t('credits.place', {count: index + 4}) }}</span>
        <div>
          <div class="avatar" v-bind:style="{'background-color': score.color, 'border-color': score.color}"
               v-bind:data-score="score.name">
            <img v-bind:src="'../common/img/avatars/' + score.avatar + '.png'" alt=""/>
          </div>
        </div>
        <span class="score" v-bind:style="'--total-count:' + score.score"></span>
        <div class="summary">
          <span class="correct" v-bind:style="'--total-count:' + score.correct"><i class="fas fa-fw fa-check"></i></span>
          <span class="failed" v-bind:style="'--total-count:' + score.wrong"><i class="fas fa-fw fa-times"></i></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: function() {
    return {
      showPlaceAbove: 0,
      celebrate: false
    }
  },
  props: ['results', 'minimized'],
  emits: ['completed', 'celebrateVictory'],

  computed: {
    resultsClass: function() {
      return this.minimized ? 'minimize' : '';
    },

    scores: function() {
      if (!this.results) {
        return [];
      }
      return Object.values(this.results).sort((a, b) => b.score - a.score);
    }
  },

  methods: {
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
      //TODO: these timeout should only have one place where it's defined or listen to animation end event
      this.showPlaceAbove--;
      if (this.showPlaceAbove > 0) {
        setTimeout(() => this.showNextScore(), 1000)
      } else {
        setTimeout(() => this.celebrateVictory(), 1000);
        setTimeout(() => this.emitCompleted(), 5000);
      }
    },

    celebrateVictory() {
      this.celebrate = true;
      this.$emit('celebrateVictory');
    },

    emitCompleted: function() {
      this.$emit('completed');
    }
  },

  created() {
    this.showPlaceAbove = this.scores.length;
    this.showNextScore();
  }
}
</script>