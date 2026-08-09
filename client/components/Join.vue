<template>
	<div class="join">
		<div>
			<form>
				<div>
					<label for="name">Name</label>
					<div>
						<input type="text" id="name" maxlength="10" v-model="config.name">
					</div>
				</div>
				<div>
					<label for="gameId">Code</label>
					<div>
						<input type="text" id="gameId" style="text-transform : uppercase" v-model="config.gameId">
					</div>
					<video id="camera" autoplay="autoplay"></video>
				</div>
				<div>
					<label for="avatar-selector">Preferred avatar</label>
					<AvatarSelector v-model="config.avatar" />
				</div>

				<ErrorMessage v-if="message">{{ message }}</ErrorMessage>

				<div class="buttons">
					<button v-on:click.prevent="join" :disabled="!validated"><i class="fas fa-fw fa-sign-in-alt"></i>Join</button>
					<button v-on:click.prevent="qrscan" v-if="supportsCamera"><i class="fas fa-qrcode"></i> Scan</button>
				</div>
			</form>
		</div>
	</div>
</template>

<script>
import ErrorMessage from "../../common/components/ErrorMessage.vue";
import AvatarSelector from "./AvatarSelector.vue";

async function resolveBackCamera() {
	let sources = await navigator.mediaDevices.enumerateDevices();
	let backCamera = sources.find((source) => {
		return source.kind === "videoinput" && source.label.toLowerCase().indexOf('back') !== -1;
	});
	if (backCamera) {
		return navigator.mediaDevices.getUserMedia({video: {deviceId: {exact: backCamera.deviceId}}});
	} else {
		return navigator.mediaDevices.getUserMedia({video: {facingMode: {exact: "environment"}}});
	}
}

export default {
	components: {AvatarSelector, ErrorMessage},
	data: function () {
		return {
			config: {
				gameId: this.gameId,
				name: this.name,
				avatar: this.preferredAvatar
			},
			supportsCamera: 'mediaDevices' in navigator,
			message: undefined
		}
	},
	computed: {
		validated: function () {
			return this.config.gameId && this.config.name;
		}
	},
	props: ['gameId', 'wakelock', 'clientState', 'connection', 'name', 'preferredAvatar'],
	methods: {
		async join() {
			try {
				let data = await this.connection.connect(this.config.gameId, this.config.name, this.config.avatar);
				await this.wakelock.acquire();
				this.clientState.setInProgressGameId(this.config.gameId);
				this.clientState.setInProgressClientId(data.clientId);
				this.$router.push({name: "game", query: {gameId: this.config.gameId, clientId: data.clientId}, state: {stats: JSON.stringify(data.stats)}});
			} catch (err) {
				this.message = "Error when joining: " + err.message;
			}
		},

		async qrscan() {
			let video = document.getElementById('camera');
			video.style.display = 'inline-block';

			let stream = await resolveBackCamera();
			video.srcObject = stream;

			function stop() {
				video.style.display = 'none';
				stream.getTracks()[0].stop();
			}

			video.addEventListener('click', stop);

			try {
				let qrData = await this._pollQrCodeFromCamera(video);
				this.config.gameId = /.*\?gameId=(.*)/.exec(qrData)[1];

				if (!!this.config.name) {
					await this.join();
				}
			} catch (e) {
				this.message = e.message;
			}
			finally {
				stop();
			}
		},
		_pollQrCodeFromCamera(video) {
			let barcodeDetector = new window.BarcodeDetector({
				formats: ['qr_code']
			});
			return new Promise((resolve, reject) => {
				const scanInterval = setInterval(async () => {
					const barcodes = await barcodeDetector.detect(video);
					if (barcodes.length > 0) {
						resolve(barcodes[0].rawValue);
					}
					if (video.style.display === 'none') {
						clearInterval(scanInterval);
						reject(new Error('Camera closed'));
					}
				}, 100);
			});
		}
	},
	created: async function () {
		if (!this.wakelock.supported()) {
			this.message = "Keeping the screen awake not supported on this device";
		}
		if (!!this.gameId) {
			this.clientState.clearInProgressClientId();
		}
		if (!!this.clientState.getInProgressGameId() && !!this.clientState.getInProgressClientId()) {
			this.$router.push({name: "game", query: {gameId: this.clientState.getInProgressGameId(), clientId: this.clientState.getInProgressClientId()}});
		}
	}
};
</script>

<style lang="scss">
@use "../../common/css/colors" as triviacolors;
.join {
	font-size: 0.75em;

	video {
		bottom : 0;
		display : none;
		left : 0;
		position : fixed;
		right : 0;
		top : 0;
		z-index : 2;
	}
	label {
		display : inline-block;
		margin : 0.2em 0;
		width : 100%;
		font-size: 2em;
	}
	input {
		background-color : triviacolors.$secondary;
		border : 0.15em solid triviacolors.$primary;
		border-radius: 0.5em;
		box-sizing: border-box;
		color : triviacolors.$primary;
		font-weight: bold;
		height : 2em;
		padding : 0.1em 0.5em;
		width : 100%;
		font-size : 2em;
		margin-bottom: 0.5em;
	}
}

</style>