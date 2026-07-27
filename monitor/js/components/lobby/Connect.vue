<template>
  <div class="connect">
    <h1>{{ $t('title') }}</h1>
    <div>
      <div class="qr">
        <img v-if="gameId != null" v-bind:src="qrUrl" alt=""/>
        <i v-if="gameId == null" class="fas fa-cog fa-spin fa-fw"></i>
      </div>
      <div class="code" v-if="gameId != null">{{ gameId }}</div>
      <div class="code" v-if="gameId == null">{{ $t('loading') }}...</div>
    </div>
    <div class="instructions" v-bind:data-url="serverUrl">
      <div>
        <h3>{{ $t('join.header') }}</h3>
        {{ $t('join.qrCodeOrUrl') }}:<br/>
        <b>{{serverUrl}}</b>
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
