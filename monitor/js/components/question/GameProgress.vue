<template>
	<div class="index">
		<div class="infobox" v-if="currentCategory && !hidden">
			<span class="current">{{ index }}</span>
			<span class="total">{{ total }}</span>
		</div>
		<div class="category infobox" v-if="currentCategory && !hidden">{{ currentCategory.fullName }}</div>
	</div>
</template>

<script>
export default {
	data: function () {
		return {
			index: 0,
			total: 0,
			currentCategory: {
				name: undefined
			}
		}
	},
	props: ['hidden'],
	methods: {
		update(index, total, currentCategory) {
			this.index = index;
			this.total = total;
			this.currentCategory = currentCategory;
		}
	}
}
</script>

<style lang="scss">
.category {
	position: relative;
	left: -0.6em;
	z-index: -1;
	border-radius: 0 0.6em 0.6em 0;
}

.index {
	.infobox {
		float: left;
	}

	.current {
		&:after {
			content: " / ";
		}
	}
}
</style>