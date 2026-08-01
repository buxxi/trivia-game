<template>
	<div class="message">
		<slot></slot>
	</div>
</template>

<script>
export default {
}
</script>

<style lang="scss">
@use "../../../common/css/colors.scss" as triviacolors;

.message {
	background-color: triviacolors.$incorrect;
	border: 0.2em solid triviacolors.$incorrect_border;
	color: triviacolors.$font;
	padding: 0.5em;
	margin: 0.5em 0;
	border-radius: 1em;
}
</style>