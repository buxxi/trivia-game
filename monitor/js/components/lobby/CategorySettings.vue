<template>
	<div id="categories">
		<h1><i class="fas fa-fw fa-list-ul"></i>{{ $t('categories.header') }}</h1>
		<ul class="circle-checkboxes" :class="{'list-view': listView}">
			<CircleCheckbox v-for="category in sortedCategories"
			                :key="category.type"
			                :id="category.type"
			                v-model="config.categories[category.type]"
			                :title="category.name"
			                :class="{'loaded': !config.categories[category.type] && category.preload.done, 'failed': category.preload.failed}"
			                :isLoaded="category.preload.done"
			                :isFailed="category.preload.failed"
			                @change="preload(category.type)"
			                @contextmenu="clearCache(category.type)"
			>
				<CategoryIcon :icon="category.icon"/>

				<template #progress v-if="config.categories[category.type] && !category.preload.done && !category.preload.failed">
					{{ category.preload.percentage() }}%
				</template>
			</CircleCheckbox>
		</ul>

		<div class="buttons">
			<button v-on:click.prevent="loadAll()"><i class="fas fa-spinner"></i> {{ $t('categories.selectAll') }}</button>
			<button v-on:click.prevent="loadRandom()"><i class="fas fa-random"></i> {{ $t('categories.selectRandom') }}</button>
			<button v-on:click.prevent="toggleListView()"><i class="fas fa-list"></i> {{ $t('categories.toggleListView') }}</button>
		</div>

		<div class="questionCount">
      <span>
          <i18next :translation="$t('categories.questionCount')">
              <template #questionCount><b>{{ questionCount }}</b></template>
          </i18next>
      </span>
		</div>
	</div>
</template>

<script>
import logger from "../../../../common/js/browser-logger.mjs";
import {useTranslation} from "i18next-vue";
import CategoryIcon from "../CategoryIcon.vue";
import CircleCheckbox from "./CircleCheckbox.vue";

class CategoryItem {
	constructor(category) {
		this.name = category.name;
		this.type = category.type;
		this.icon = category.icon;
		this.preload = new PreloadData();
	}
}

class PreloadData {
	constructor() {
		this.questionCount = 0;
		this.current = 0;
		this.total = 0;
		this.done = false;
		this.running = false;
		this.failed = false;
	}

	percentage() {
		return Math.ceil(this.current / Math.max(this.total, 1) * 100);
	}
}

export default {
	components: {CircleCheckbox, CategoryIcon},
	data: function () {
		return {
			listView: false,
			i18n: useTranslation(),
			categoryItems: []
		}
	},
	props: ['config', 'categories'],
	emits: ['preloadCategory', 'clearCache'],
	computed: {
		questionCount: function () {
			return this.categoryItems.filter(c => this.config.categories[c.type]).map(c => c.preload.questionCount).reduce((a, b) => a + b, 0);
		},
		sortedCategories: function () {
			if (this.listView) {
				return this.categoryItems.toSorted((a, b) => a.name.localeCompare(b.name));
			} else {
				return this.categoryItems;
			}
		}
	},
	watch: {
		categories: function (newCategories, _) {
			this.categoryItems = newCategories.map(c => new CategoryItem(c));
		}
	},
	methods: {
		preload: async function (type) {
			let category = this.categoryItems.find(c => c.type === type);
			let preload = category.preload;

			if (preload.running || !this.config.categories[type]) {
				return;
			}

			preload.running = true;

			function updateProgress(current, total) {
				preload.current = current;
				preload.total = total;
			}

			try {
				category.preload.questionCount = await new Promise((resolve, reject) => {
					this.$emit('preloadCategory', type, updateProgress, resolve, reject);
				});
				preload.done = true;
			} catch (e) {
				logger.error(e);
				preload.failed = true;
				delete this.config.categories[type];
			}
			preload.running = false;
		},
		loadAll: async function () {
			try {
				for (let type of this.categoryItems.map(c => c.type)) {
					this.config.categories[type] = true;
					await this.preload(type);
				}
			} catch (e) {
				logger.error(e);
			}
		},
		loadRandom: async function () {
			let possible = this.categoryItems.filter(c => !this.config.categories[c.type]);
			let rnd = possible.length * Math.random() << 0;
			this.config.categories[possible[rnd].type] = true;
			await this.preload(possible[rnd].type);
		},

		toggleListView: function () {
			this.listView = !this.listView;
		},

		clearCache: async function (category) {
			if (!confirm(this.i18n.t('categories.clearCache', {category: category}))) {
				return;
			}
			try {
				this.config.categories[category] = false;
				await new Promise((resolve, reject) => {
					this.$emit('clearCache', category, resolve, reject);
				});
			} catch (e) {
				this.message = this.i18n.t('errors.clearCache', {message: e.message});
			}
		}
	}
}
</script>

<style lang="scss">
@use "../../../../common/css/colors.scss" as triviacolors;

.circle-checkboxes.list-view {
	font-size: 0.75em;
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
	align-items: self-start;
	max-height: 50vh;
	overflow: auto;
	padding-bottom: 1em;
	scrollbar-width: auto;
	scrollbar-color: triviacolors.$primary transparent;
	scrollbar-gutter: stable;

	.circle-checkbox {
		flex: 1 1;
		display: block;

		label:after {
			padding: 0 0.5em;
			content: attr(title);
		}
	}
}

button {
	align-items: center;
	background-color: triviacolors.$primary;
	border: 0.2em solid triviacolors.$primary_border;
	border-radius: 0.5em;
	cursor: pointer;
	font-weight: bold;
	line-height: 1em;
	margin: 0.5em;
	padding: 0.5em;
	color: white;
	text-decoration: none;
	overflow: hidden;
	outline: none;

	&:active {
		border-color: triviacolors.$secondary_border;
	}

	&[disabled=""] {
		background-color: triviacolors.$incorrect;
		border-color: triviacolors.$incorrect_border;
		cursor: not-allowed;
	}
}
</style>