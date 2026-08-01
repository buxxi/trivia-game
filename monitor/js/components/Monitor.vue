<template>
	<router-view/>
</template>

<style lang="scss">
@use "sass:color";
@use "../../../common/css/colors.scss" as triviacolors;
@use "../../../common/css/fonts.scss" as *;

html {
	$gradient_background: color.adjust(triviacolors.$background, $alpha: -0.8, $space: hsl);
	$gradient_background_secondary: color.adjust(triviacolors.$background_secondary, $alpha: -0.6, $space: hsl);
	background: radial-gradient(triviacolors.$background_secondary 0%, $gradient_background_secondary 20%, $gradient_background 100%),
				repeating-conic-gradient($gradient_background 0deg, $gradient_background_secondary 20deg, $gradient_background 40deg),
				black;
	height : 100%;
}

body {
	@media (min-height: 720px) {
		font-size: 0.666em;
	}
	@media (min-height: 810px) {
		font-size: 0.75em;
	}
	@media (min-height: 1080px) {
		font-size: 1em;
	}
	@media (min-height: 1440px) {
		font-size: 1.25em;
	}
	@media (min-height: 1620px) {
		font-size: 1.5em;
	}
	@media (min-height: 1890px) {
		font-size: 1.75em;
	}
	@media (min-height: 2160px) {
		font-size: 2em;
	}
	color : triviacolors.$font;
	overflow : hidden;
}

h1 {
	color : triviacolors.$secondary;

	i {
		color : triviacolors.$primary;
		padding-right: 0.5em;
		font-size: 0.8em;
	}

	&::after {
		border: 0.075em solid triviacolors.$primary;
		content: "";
		display: block;
		margin-left: 20%;
		margin-top: 0.1em;
		width: 60%;
	}
}

ol {
	counter-reset: help;
	display: inline-block;
	list-style: none;
	padding-left : 1em;
	li {
		height : 2em;
		margin-bottom : 0.5em;
		text-align: left;
		&:before {
			background-color : triviacolors.$primary_border;
			border-radius: 1em;
			border: 0.1em solid triviacolors.$primary;
			content : counter(help);
			counter-increment: help;
			display : inline-block;
			font-weight: bold;
			height : 1em;
			line-height: 1em;
			margin-left : -2em;
			margin-right : 0.5em;
			margin-top : -0.25em;
			padding : 0.25em;
			position : absolute;
			text-align: center;
			width : 1em;
		}
	}
}

.infobox {
	background-color: triviacolors.$secondary;
	border-radius: 0.6em;
	border: 0.3em solid triviacolors.$secondary_border;
	color: triviacolors.$primary;
	font-weight: bold;
	font-size: 1.25em;
	padding: 0.5em 1em;
}

.playerlist {
	margin-bottom : 0;
	font-size: 1.35em;
	li {
		display: inline-block;
		list-style : none;
		margin: 0 1em 1em 0;
	}
}
</style>