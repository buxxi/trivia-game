<template>
	<div class="general">
		<NumericInput id="questions" icon="fa-question" step="5" min="5" :title="$t('settings.questions')" v-model="config.questions"/>
		<NumericInput id="time" icon="fa-hourglass" step="5" min="5" :title="$t('settings.time')" v-model="config.time"/>
		<NumericInput id="points" icon="fa-star" step="100" min="100" :title="$t('settings.pointsPerRound')" v-model="config.pointsPerRound"/>
		<NumericInput v-if="config.allowMultiplier" id="maxMultiplier" icon="fa-times" step="1" min="1" :title="$t('settings.maxMultiplier')" v-model="config.maxMultiplier"/>
		<NumericInput id="lossPercentage" icon="fa-arrow-trend-down" step="10" min="0" max="100" suffix="%" :title="$t('settings.lossPercentage')" v-model="config.lossPercentage"/>

		<ul class="circle-checkboxes">
			<CircleCheckbox id="stop" v-model="config.stopOnAnswers" :title="$t('settings.stopOnAnswers')">
				<SettingsIcon icon="fa-stop"/>
			</CircleCheckbox>
			<CircleCheckbox id="multiplier" v-model="config.allowMultiplier" :title="$t('settings.allowMultiplier')">
				<SettingsIcon icon="fa-times"/>
			</CircleCheckbox>
			<CircleCheckbox id="backgroundMusic" v-model="config.sound.backgroundMusic" :title="$t('settings.backgroundMusic')">
				<SettingsIcon icon="fa-music"/>
			</CircleCheckbox>
			<CircleCheckbox id="text2Speech" v-model="config.sound.text2Speech" :title="$t('settings.text2Speech')">
				<SettingsIcon icon="fa-comment"/>
			</CircleCheckbox>
			<CircleCheckbox id="soundEffects" v-model="config.sound.soundEffects" :title="$t('settings.soundEffects')">
				<SettingsIcon icon="fa-exclamation"/>
			</CircleCheckbox>
			<CircleCheckbox id="spinner" v-model="config.categorySpinner" :title="$t('settings.categorySpinner')">
				<SettingsIcon icon="fa-spinner"/>
			</CircleCheckbox>
			<CircleCheckbox id="statistics" v-model="config.saveStatistics" :title="$t('settings.saveStatistics')">
				<SettingsIcon icon="fa-chart-simple"/>
			</CircleCheckbox>
			<CircleCheckbox id="fullscreen" v-model="config.fullscreen" :title="$t('settings.fullscreen')" @change="toggleFullScreen()">
				<SettingsIcon icon="fa-window-maximize"/>
			</CircleCheckbox>
			<CircleCheckbox id="language" :modelValue="true" :title="$t('settings.language')" @change="nextLanguage()">
				<span class="icon">
					<i>{{ config.language.toUpperCase() }}</i>
				</span>
			</CircleCheckbox>
		</ul>
	</div>
</template>

<script>
import {useTranslation} from "i18next-vue";
import NumericInput from "./NumericInput.vue";
import CircleCheckbox from "./CircleCheckbox.vue";
import SettingsIcon from "./SettingsIcon.vue";

export default {
	components: {SettingsIcon, CircleCheckbox, NumericInput},
	data: function () {
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
		toggleFullScreen: function () {
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
	created() {
		this.config.language = this.i18n.i18next.language;
	}
}
</script>