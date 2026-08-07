<template>
	<div id="avatar-selector">
		<button v-on:click.prevent="scrollAvatarsLeft"><i class="fa-solid fa-arrow-left"></i></button>
		<div>
			<label v-for="avatar in avatars">
				<input type="radio" name="avatar" @change="onChange" :value="avatar"/>
				<Avatar :avatar="avatar"/>
			</label>
		</div>
		<button v-on:click.prevent="scrollAvatarsRight"><i class="fa-solid fa-arrow-right"></i></button>
	</div>
</template>

<script>
import Avatar from "../../common/components/Avatar.vue";
import avatars from "../../common/js/avatars.mjs";

export default {
	data: function () {
		return {
			avatars: avatars
		}
	},
	props: ['modelValue'],
	emits: ['update:modelValue'],
	components: {Avatar},
	methods: {
		onChange($event) {
			this.$emit('update:modelValue', $event.target.value);
		},

		scrollAvatarsLeft() {
			let selector = document.querySelector("#avatar-selector div");
			let width = selector.clientWidth;
			selector.scrollLeft -= width;
		},

		scrollAvatarsRight () {
			let selector = document.querySelector("#avatar-selector div");
			let width = selector.clientWidth;
			selector.scrollLeft += width;
		}
	}
}
</script>


<style lang="scss">
@use "../../common/css/colors" as triviacolors;
#avatar-selector {
	display : flex;
	div {
		font-size: 0.65em;
		clear : both;
		overflow-x: scroll;
		white-space: nowrap;

		label {
			width : auto;
		}
		input {
			display : none;
		}
		input:checked + .avatar {
			background-color : triviacolors.$primary;
		}
	}
	button {
		min-width: 2em;
	}
}
</style>