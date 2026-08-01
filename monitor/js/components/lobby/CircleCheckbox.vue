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
		computedClasses() {
			return ['circle-checkbox', {
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

<style lang="scss">
@use "../../../../common/css/colors.scss" as triviacolors;

/*TODO: doesn't belong here*/
ul.circle-checkboxes {
	padding: 0;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
}

.circle-checkbox {
	font-size: 1.5em;
	list-style: none;
	vertical-align: top;
	position: relative;
	flex: 0 0 2em;

	.progress {
		font-size: 0.4em;
		text-align: center;
		display: inline;
		position: absolute;
		top: 0.6em;
		left: 4em;
		background-color: triviacolors.$primary;
		width: 2.5em;
		height: 2.5em;
		line-height: 2.5em;
		border-radius: 2em;
		font-weight: bold;
	}

	.icon {
		background: triviacolors.$primary_border;
		border: 0.2em solid triviacolors.$primary;
		border-radius: 10em;
		cursor: pointer;
		display: inline-block;
		height: 2em;
		line-height: 2em;
		margin: 0.25em 0.10em;
		width: 2em;
		font-style: normal !important;
	}

	&.selected {
		.icon {
			background: radial-gradient(circle at center, triviacolors.$primary 0%, triviacolors.$primary_border 100%);
		}
	}

	&.failed {
		.icon {
			background: radial-gradient(circle at center, triviacolors.$incorrect 0%, triviacolors.$incorrect_border 100%);
			border-color: triviacolors.$incorrect_border;
		}
	}

	img {
		height: 50%;
		width: 50%;
		padding-top: 0.5em;
		filter: grayscale(100%) contrast(1000%) invert(100%);
		mix-blend-mode: screen;
	}

	input[type='checkbox'] {
		height: 0;
		position: absolute;
		visibility: hidden;
		width: 0;
	}
}
</style>