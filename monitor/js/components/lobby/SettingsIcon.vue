<template>
	<span class="icon">
		<i :class="['fas', 'fa-fw', icon]"></i>
	</span>
</template>

<script>
export default {
	props: ['icon']
}
</script>