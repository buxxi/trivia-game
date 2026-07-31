<template>
	<li :class="computedClasses">
		<label :for="id" :title="title" @contextmenu.prevent="onContextMenu">
			<input
				type="checkbox"
				:id="id"
				:checked="modelValue"
				@change="onChange"
			/>
			<!-- Icon slot is the default when nothing else specified -->
			<slot></slot>
		</label>
		<div class="progress" v-if="$slots.progress">
			<slot name="progress"></slot>
		</div>
	</li>
</template>

<script>
export default {
	props: ['modelValue', 'id', 'title'],
	emits: ['update:modelValue', 'change', 'contextmenu'],
	computed: {
		computedClasses () {
			return [{
				'selected': this.modelValue
			}, this.$attrs.class];
		}
	},
	methods: {
		onChange($event) {
			this.$emit('update:modelValue', $event.target.checked);
			this.$emit('change');
		},

		onContextMenu() {
			this.$emit('contextmenu');
		}
	}
}
</script>