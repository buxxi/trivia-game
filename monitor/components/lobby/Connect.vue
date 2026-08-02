<template>
	<div class="connect">
		<h1>{{ $t('title') }}</h1>
		<div>
			<div class="qr">
				<img v-if="gameId != null" :src="qrUrl" alt=""/>
				<i v-if="gameId == null" class="fas fa-cog fa-spin fa-fw"></i>
			</div>
			<div class="code" v-if="gameId != null">{{ gameId }}</div>
			<div class="code" v-if="gameId == null">{{ $t('loading') }}...</div>
		</div>
		<div class="instructions" :data-url="serverUrl">
			<div>
				<h3>{{ $t('join.header') }}</h3>
				{{ $t('join.qrCodeOrUrl') }}:<br/>
				<b>{{ serverUrl }}</b>
			</div>
		</div>
	</div>
</template>

<script>
import {qrcode} from "qrcode-generator";

export default {
	props: ['gameId'],
	computed: {
		serverUrl() {
			return new URL("..", document.location).toString();
		},

		qrUrl() {
			if (!this.gameId) {
				return undefined;
			}
			let clientUrl = new URL("../client#", document.location) + "?gameId=" + this.gameId;
			let qr = qrcode(0, 'L');
			qr.addData(clientUrl);
			qr.make();
			return qr.createDataURL(10, 30);
		}
	}
}
</script>

<style lang="scss">
@use "../../../common/css/colors" as triviacolors;

.connect {
	float: left;
	text-align: center;
	width: 25%;

	.qr {
		display: inline-block;
		background-color: triviacolors.$secondary;
		border-radius: 1em 1em 0 0;
		margin-bottom: -0.3em;
		border: 0.3em solid triviacolors.$primary;
		width: 24em;
		height: 24em;
		overflow: hidden;

		i {
			line-height: 24em;
			color: triviacolors.$primary;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.code {
		background-color: triviacolors.$primary;
		border-radius: 0 0 1em 1em;
		display: inline-block;
		font-weight: bold;
		margin: 0;
		padding: 1em 0;
		text-transform: uppercase;
		width: 24em;
		border: 0.3em solid triviacolors.$primary;
	}

	.instructions {
		width: 24.8em;
		height: 50em;

		font-family: Arial;
		background-image: url('../../img/phone.png');
		background-size: contain;
		padding-top: 8.25em;
		padding-left: 1.2em;
		padding-right: 1.5em;
		box-sizing: border-box;
		transform: rotate3d(1, 2.0, 3.0, 10deg) scale(0.8);

		&:before {
			content: attr(data-url);
			position: absolute;
			color: black;
			margin-top: -1.6em;
			margin-left: -7.5em;
			font-size: 1.1em;
		}

		div {
			background-color: white;
			color: black;
			height: 21em;
			padding: 0.3em;
			line-height: 1.2em;
			font-size: 1.7em;
		}
	}
}
</style>