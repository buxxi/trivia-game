<template>
  <div class="rules">
    <h1><i class="fas fa-fw fa-gavel"></i>{{ $t('rules.header') }}</h1>
    <ol>
      <li>{{ $t('rules.controller') }}</li>
      <li>{{ $t('rules.scoring', {lossPercentage: lossPercentage}) }}</li>
      <li>{{ $t('rules.belowZero') }}</li>
      <li>{{ $t('rules.speed') }}</li>
      <li v-if="allowMultiplier">{{ $t('rules.multiplier.correct', {maxMultiplier: maxMultiplier }) }}</li>
      <li v-if="allowMultiplier">{{ $t('rules.multiplier.incorrect') }}</li>
      <li v-if="allowMultiplier">{{ $t('rules.multiplier.unanswered') }}</li>
      <li>
        <i18next :translation="$t('rules.time')" >
          <template #seconds><b>{{time}}</b></template>
        </i18next>
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  props: ['lossPercentage', 'maxMultiplier', 'allowMultiplier', 'time']
}
</script>