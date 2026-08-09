<template>
	<component :is="tag" :class="`button-icon-${answer}`" v-bind="$attrs">
		<slot></slot>
	</component>
</template>

<script>
export default {
	props: ['tag', 'answer']
}
</script>

<style lang="scss">
@use "sass:color";
@use "../css/colors" as triviacolors;

@mixin button-icon($color, $text) {
	$border: color.adjust($color, $lightness: -10%, $space: hsl);
	&:before {
		background-color : $color;
		border-color : $border;
		border-radius: 1.5em;
		border-style : solid;
		border-width: 0.1em;
		color : triviacolors.$font;
		content : $text;
		display : inline-block;
		font-weight: bold;
		margin-right : 0.2em;
		padding : 0.2em;
		font-size: 1.5em;
		line-height: 1em;
		width: 1em;
		text-align: center;
		flex-shrink: 0;
	}
}

.button-icon-A {
	@include button-icon(triviacolors.$A_color, "A");
}

.button-icon-B {
	@include button-icon(triviacolors.$B_color, "B");
}

.button-icon-C {
	@include button-icon(triviacolors.$C_color, "C");
}

.button-icon-D {
	@include button-icon(triviacolors.$D_color, "D");
}

</style>