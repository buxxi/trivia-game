<template>
  <div class="general">
    <div class="numeric-input">
      <label for="questions" v-bind:title="$t('settings.questions')"><i class="fas fa-fw fa-question"></i></label>
      <input type="number" id="questions" step="5" min="5" v-model="config.questions">
    </div>

    <div class="numeric-input">
      <label for="time" v-bind:title="$t('settings.time')"><i class="fas fa-fw fa-hourglass"></i></label>
      <input type="number" id="time" step="5" min="5" v-model="config.time">
    </div>

    <div class="numeric-input">
      <label for="points" v-bind:title="$t('settings.pointsPerRound')"><i class="fas fa-fw fa-star"></i></label>
      <input type="number" id="points" step="100" min="100" v-model="config.pointsPerRound">
    </div>

    <div class="numeric-input" v-if="config.allowMultiplier">
      <label for="maxMultiplier" v-bind:title="$t('settings.maxMultiplier')"><i class="fas fa-fw fa-times"></i></label>
      <input type="number" id="maxMultiplier" step="1" min="1" v-model="config.maxMultiplier">
    </div>

    <div class="numeric-input">
      <label for="lossPercentage" v-bind:title="$t('settings.lossPercentage')"><i class="fas fa-fw fa-arrow-trend-down"></i></label>
      <input type="number" id="lossPercentage" step="10" min="0" max="100" v-model="config.lossPercentage">%
    </div>

    <ul class="circle-checkboxes">
      <li v-bind:class="{'selected' : config.stopOnAnswers}">
        <label for="stop" v-bind:title="$t('settings.stopOnAnswers')"><input type="checkbox" id="stop" v-model="config.stopOnAnswers"><span class="icon"><i class="fas fa-stop"></i></span></label>
      </li>
      <li v-bind:class="{'selected' : config.allowMultiplier}">
        <label for="multiplier" v-bind:title="$t('settings.allowMultiplier')"><input type="checkbox" id="multiplier" v-model="config.allowMultiplier"><span class="icon"><i class="fas fa-times"></i></span></label>
      </li>
      <li v-bind:class="{'selected' : config.sound.backgroundMusic}">
        <label for="backgroundMusic" v-bind:title="$t('settings.backgroundMusic')"><input type="checkbox" id="backgroundMusic" v-model="config.sound.backgroundMusic"><span class="icon"><i class="fas fa-music"></i></span></label>
      </li>
      <li v-bind:class="{'selected' : config.sound.text2Speech}">
        <label for="text2Speech" v-bind:title="$t('settings.text2Speech')"><input type="checkbox" id="text2Speech" v-model="config.sound.text2Speech"><span class="icon"><i class="fas fa-comment"></i></span></label>
      </li>
      <li v-bind:class="{'selected' : config.sound.soundEffects}">
        <label for="soundEffects" v-bind:title="$t('settings.soundEffects')"><input type="checkbox" id="soundEffects" v-model="config.sound.soundEffects"><span class="icon"><i class="fas fa-exclamation"></i></span></label>
      </li>
      <li v-bind:class="{'selected' : config.categorySpinner}">
        <label for="spinner" v-bind:title="$t('settings.categorySpinner')"><input type="checkbox" id="spinner" v-model="config.categorySpinner"><span class="icon"><i class="fas fa-spinner"></i></span></label>
      </li>
      <li v-bind:class="{'selected' : config.saveStatistics}">
        <label for="statistics" v-bind:title="$t('settings.saveStatistics')"><input type="checkbox" id="statistics" v-model="config.saveStatistics"><span class="icon"><i class="fas fa-chart-simple"></i></span></label>
      </li>
      <li v-bind:class="{'selected' : config.fullscreen}">
        <label for="fullscreen" v-bind:title="$t('settings.fullscreen')"><input type="checkbox" id="fullscreen" v-model="config.fullscreen" v-on:change="toggleFullScreen()"><span class="icon"><i class="fas fa-window-maximize"></i></span></label>
      </li>
      <li class="selected">
        <label for="language" v-bind:title="$t('settings.language')"><input type="checkbox" id="language" v-on:click="nextLanguage()"><span class="icon"><i>{{config.language.toUpperCase()}}</i></span></label>
      </li>
    </ul>
  </div>

</template>


<script>
import {useTranslation} from "i18next-vue";

export default {
  data: function() {
    return {
      i18n: useTranslation()
    }
  },
  props: ['config'],
  emits: ['languageChanged'],
  methods: {
    nextLanguage() {
      let languages = Object.keys(this.i18n.i18next.store.data);
      let i = (languages.indexOf(this.config.language) + 1) % languages.length;
      this.config.language = languages[i];
      this.i18n.i18next.changeLanguage(this.config.language);
      this.$emit('languageChanged', this.config.language);
    },
    toggleFullScreen: function() {
      let fullScreenMode = () => !!document.fullscreenElement;
      let notify = () => {
        this.config.fullscreen = fullScreenMode();
      }
      document.addEventListener("fullscreenchange", notify);
      if (fullScreenMode()) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }
  },
  created () {
    this.config.language = this.i18n.i18next.language;
  }
}
</script>