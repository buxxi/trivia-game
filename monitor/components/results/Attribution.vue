<template>
	<div class="attribution">
		<h1>{{ title }}</h1>
		<span>{{ name }}</span>
		<ul>
			<li v-for="link in links">
				<a :href="link">{{ $t(linkTextTranslationKey, {domain: domain(link)}) }} <i class="fas fa-fw fa-external-link-alt"></i></a>
			</li>
		</ul>
	</div>
</template>

<script>
export default {
	props: ['title', 'name', 'links', 'linkTextTranslationKey'],
	methods: {
		domain : function(link) {
			try {
				return new URL(link).hostname;
			} catch (e) {
				return link;
			}
		}
	}
}
</script>