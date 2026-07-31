<template>
	<span class="icon">
		<i v-if="icon.indexOf('url:') === -1" :class="['fa', 'fa-fw', icon]"></i>
		<img v-if="icon.indexOf('url:') === 0" :src="icon.substring(4)" alt=""/>
	</span>
</template>

<script>
export default {
	props: ['icon']
}
</script>

