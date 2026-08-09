<template>
	<div class="numeric-input">
		<label :for="$attrs.id" :title="title">
			<i :class="['fas', 'fa-fw', icon]"></i>
		</label>

		<input
			type="number"
			v-bind="$attrs"
			:value="modelValue"
			@input="onInput"
		>
		<span v-if="suffix">{{ suffix }}</span>
	</div>
</template>
<script>
export default {
	props: ['modelValue', 'title', 'icon', 'suffix'],
	emits: ['update:modelValue'],
	inheritAttrs: false,
	methods: {
		onInput($event) {
			this.$emit('update:modelValue', Number($event.target.value))
		}
	}
}
</script>

<style lang="scss">
@use "../../../common/css/colors" as triviacolors;

.numeric-input {
	color : triviacolors.$font;
	font-size: 1.4em;
	display : inline-flex;
	border: 0.2em solid triviacolors.$primary;
	border-radius: 1em;
	overflow: hidden;
	margin: 0.25em;
	background-color: triviacolors.$primary_border;
	padding-right: 0.25em;
	align-items: center;

	label {
		display : inline-block;
		color: triviacolors.$font;
		padding: 0.25em;
		border-right : 0.1em solid triviacolors.$primary;
	}

	input {
		-moz-appearance : textfield;
		-webkit-appearance : textfield;
		appearance : textfield;
		background-color: transparent;
		border : 0;
		color : triviacolors.$font;
		font-size: 1em;
		font-weight: bold;
		width : 2.5em;
		text-align: center;
		outline : none;

		&:invalid {
			box-shadow : none;
		}
	}
}
</style>