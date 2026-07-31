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