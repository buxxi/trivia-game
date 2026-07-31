<template>
	<div id="credits" :style="{'animation-duration': duration + 's'}" :class="creditsClass">
		<Attribution v-for="attr in attribution" :title="attr.title" :name="attr.name" :links="attr.links" linkTextTranslationKey="credits.attribution"/>

		<Attribution :title="$t('credits.music.by')" name="Suno" :links="['https://suno.com/s/FnM53Cv3rCqP0xfp']" linkTextTranslationKey="credits.music.suno"/>

		<Attribution :title="$t('credits.game.by')" name="BuXXi" :links="['https://github.com/buxxi/trivia-game']" linkTextTranslationKey="credits.game.source"/>
	</div>
</template>

<script>
import Attribution from "./Attribution.vue";

export default {
	components: {Attribution},
	props: ['scrolling', 'history'],

	computed: {
		duration: function () {
			if (!this.history || !this.history) {
				return 0;
			}
			return (this.history.length + 2) * 5;
		},

		attribution: function () {
			if (!this.history) {
				return [];
			}
			return this.history.map((question) => question.view.attribution);
		},

		creditsClass: function () {
			return this.scrolling ? 'scrolling' : '';
		}
	}
}
</script>
