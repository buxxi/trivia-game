<template>
  <div id="categories">
    <h1><i class="fas fa-fw fa-list-ul"></i>{{ $t('categories.header') }}</h1>
    <ul class="circle-checkboxes" v-bind:class="{'list-view': listView}">
      <li v-bind:class="{'selected' : config.categories[category.type] && category.preload.done, 'loaded' : !config.categories[category.type] && category.preload.done, 'failed' : category.preload.failed}" v-for="category in sortedCategories">
        <label v-bind:title="category.name" v-on:contextmenu.prevent="clearCache(category.type)">
          <input type="checkbox" v-bind:id="category.type" v-model="config.categories[category.type]" v-on:change="preload(category.type)">
          <span class="icon">
            <i v-if="category.icon.indexOf('url:') === -1" v-bind:class="['fa',category.icon]"></i>
            <img v-if="category.icon.indexOf('url:') === 0" v-bind:src="category.icon.substring(4)" alt=""/>
          </span>
        </label>
        <div class="progress" v-if="config.categories[category.type] && !category.preload.done && !category.preload.failed">{{ category.preload.percentage() }}%</div>
      </li>
    </ul>

    <div class="buttons">
      <button v-on:click.prevent="loadAll()"><i class="fas fa-spinner"></i> {{ $t('categories.selectAll') }}</button>
      <button v-on:click.prevent="loadRandom()"><i class="fas fa-random"></i> {{ $t('categories.selectRandom') }}</button>
      <button v-on:click.prevent="toggleListView()"><i class="fas fa-list"></i> {{ $t('categories.toggleListView') }}</button>
    </div>

    <div class="questionCount">
      <span>
          <i18next :translation="$t('categories.questionCount')">
              <template #questionCount><b>{{questionCount}}</b></template>
          </i18next>
      </span>
    </div>
  </div>
</template>

<script>
import logger from "../../../../common/js/browser-logger.mjs";
import {useTranslation} from "i18next-vue";

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
  data: function() {
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
    sortedCategories: function() {
      if (this.listView) {
        return this.categoryItems.toSorted((a, b) => a.name.localeCompare(b.name));
      } else {
        return this.categoryItems;
      }
    }
  },
  watch: {
    categories: function(newCategories, _) {
      this.categoryItems = newCategories.map(c => new CategoryItem(c));
    }
  },
  methods: {
    preload: async function(type) {
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
    loadAll: async function() {
      try {
        for (let type of this.categoryItems.map(c => c.type)) {
          this.config.categories[type] = true;
          await this.preload(type);
        }
      } catch (e) {
        logger.error(e);
      }
    },
    loadRandom: async function() {
      let possible = this.categoryItems.filter(c => !this.config.categories[c.type]);
      let rnd = possible.length * Math.random() << 0;
      this.config.categories[possible[rnd].type] = true;
      await this.preload(possible[rnd].type);
    },

    toggleListView: function() {
      this.listView = !this.listView;
    },

    clearCache: async function(category) {
      if (!confirm(this.i18n.t('categories.clearCache', {category : category}))) {
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
