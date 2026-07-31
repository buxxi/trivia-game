<template>
	<div class="avatar" :style="{'background-color': color, 'border-color': color}" :data-score="score" :data-multiplier="multiplier" :data-ping="ping">
		<img v-if="!isIcon" :src="'../common/img/avatars/' + avatar + '.png'" alt=""/>
		<i v-if="isIcon" :class="['fa-solid', avatar]"></i>
	</div>
</template>

<script>
export default {
	props: ['color', 'score', 'avatar', 'multiplier', 'ping'],

	computed: {
		isIcon() {
			return this.avatar.startsWith('fa-');
		}
	}
}
</script>

