<template>
  <div id="credits" v-bind:style="{'animation-duration': duration + 's'}" v-bind:class="creditsClass">
    <div v-for="attr in attribution" class="attribution">
      <h1>{{ attr.title }}</h1>
      <span>{{ attr.name }}</span>
      <ul>
        <li v-for="link in attr.links">
          <a v-bind:href="link">{{ $t('credits.attribution', {domain: domain(link)}) }} <i class="fas fa-fw fa-external-link-alt"></i></a>
        </li>
      </ul>
    </div>

    <div class="attribution">
      <h1>{{ $t('credits.music.by') }}</h1>
      <span>Suno</span>
      <ul>
        <li>
          <a href="https://suno.com/s/FnM53Cv3rCqP0xfp">{{ $t('credits.music.suno') }} <i class="fas fa-fw fa-external-link-alt"></i></a>
        </li>
      </ul>
    </div>

    <div class="attribution">
      <h1>{{ $t('credits.game.by') }}</h1>
      <span>BuXXi</span>
      <ul>
        <li>
          <a href="https://github.com/buxxi/trivia-game">{{ $t('credits.game.source') }} <i class="fas fa-fw fa-external-link-alt"></i></a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  props: ['scrolling', 'history'],

  computed: {
    duration: function() {
      if (!this.history || !this.history) {
        return 0;
      }
      return (this.history.length + 2) * 5;
    },

    attribution: function() {
      if (!this.history) {
        return [];
      }
      return this.history.map((question) => question.view.attribution);
    },

    creditsClass: function() {
      return this.scrolling ? 'scrolling' : '';
    }
  },
  methods: {
    domain : function(link) {
      try {
        return new URL(link).hostname;
      } catch (e) {
        return link;
      }
    }
  }
}
</script>
