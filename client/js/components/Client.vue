<template>
	<router-view/>
</template>

<style lang="scss">
@use "sass:color";

@use "../../../common/css/colors.scss" as triviacolors;
@use "../../../common/css/fonts.scss" as fonts;


html {
	$gradient_background: color.adjust(triviacolors.$background, $alpha: -0.8, $space: hsl);
	background:
		linear-gradient(triviacolors.$background_secondary 0%, $gradient_background 100%),
		black;
	height : 100%;
}

body {
	color : triviacolors.$font;
	overflow : hidden;
}

.buttons {
	button {
		font-size: 2.5em;
		width: calc(100% - 1em);
		justify-content : center;
		i {
			margin-right : 0.5em;
		}
	}
}

button {
	display : flex;
	align-items: center;
	background-color: triviacolors.$primary;
	border : 0.2em solid triviacolors.$primary_border;
	border-radius: 0.5em;
	cursor : pointer;
	font-size: 1.5em;
	font-weight: bold;
	line-height: 1em;
	margin : 0.5em;
	padding : 0.5em;
	color : white;
	text-decoration: none;
	overflow : hidden;
	outline : none;

	&:active {
		border-color : triviacolors.$secondary_border;
	}

	&[disabled="disabled"] {
		cursor : not-allowed;
	}
}
</style>
