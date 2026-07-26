<script>
async function resolveBackCamera() {
  let sources = await navigator.mediaDevices.enumerateDevices();
  let backCamera = sources.find((source) => {
    return source.kind === "videoinput" && source.label.toLowerCase().indexOf('back') !== -1;
  });
  if (backCamera) {
    return navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: backCamera.deviceId } } });
  } else {
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } });
  }
}

export default {
  data: function() { return {
    config: {
      gameId : this.gameId,
      name : this.name,
      avatar : this.preferredAvatar
    },
    supportsCamera: QCodeDecoder().hasGetUserMedia(),
    avatars: [],
    message : undefined
  }},
  computed: {
    validated: function() {
      return this.config.gameId && this.config.name;
    }
  },
  props: ['gameId', 'wakelock', 'clientState', 'connection', 'name', 'preferredAvatar'],
  methods: {
    join: async function() {
      try {
        let data = await this.connection.connect(this.config.gameId, this.config.name, this.config.avatar);
        await this.wakelock.acquire();
        this.clientState.setInProgressGameId(this.config.gameId);
        this.clientState.setInProgressClientId(data.clientId);
        this.$router.push({ name: "game", query : { gameId: this.config.gameId, clientId: data.clientId }, state: { stats: JSON.stringify(data.stats) } });
      } catch (err) {
        this.message = "Error when joining: " + err.message;
      }
    },

    qrscan: function() {
      let config = this.config;
      let decoder = QCodeDecoder();
      let video = document.getElementById('camera');
      video.style.display = 'inline-block';

      resolveBackCamera().then((stream) => {
        if ("srcObject" in video) {
          video.srcObject = stream;
        } else {
          video.src = window.URL.createObjectURL(stream);
        }

        function stop() {
          video.style.display = 'none';
          stream.getTracks()[0].stop();
        }

        video.addEventListener('click', stop);

        decoder.decodeFromVideo(video, (_, res) => {
          if (res) {
            config.gameId = /.*\?gameId=(.*)/.exec(res)[1];

            if (!!config.name) {
              this.join();
            }

            stop();
          }
        }, true);
      });
    },

    scrollAvatarsLeft: function() {
      let selector = document.querySelector("#avatar-selector div");
      let width = selector.clientWidth;
      selector.scrollLeft -= width;
    },

    scrollAvatarsRight: function() {
      let selector = document.querySelector("#avatar-selector div");
      let width = selector.clientWidth;
      selector.scrollLeft += width;
    }
  },
  created: async function() {
    let request = await fetch("avatars.json");
    let avatars = await request.json();
    avatars.forEach((avatar) => this.avatars.push(avatar));
    if (!this.wakelock.supported()) {
      this.message = "Keeping the screen awake not supported on this device";
    }
    if (!!this.gameId) {
      this.clientState.clearInProgressClientId();
    }
    if (!!this.clientState.getInProgressGameId() && !!this.clientState.getInProgressClientId()) {
      this.$router.push({ name: "game", query : { gameId: this.clientState.getInProgressGameId(), clientId: this.clientState.getInProgressClientId() } });
    }
  }
};
</script>

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
          <div id="avatar-selector">
            <button v-on:click.prevent="scrollAvatarsLeft"><i class="fa-solid fa-arrow-left"></i></button>
            <div>
              <label v-for="avatar in avatars">
                <input type="radio" name="avatar" v-model="config.avatar" v-bind:value="avatar"/>
                <div class="avatar"><img v-bind:src="'../common/img/avatars/' + avatar + '.png'" alt=""/></div>
              </label>
            </div>
            <button v-on:click.prevent="scrollAvatarsRight"><i class="fa-solid fa-arrow-right"></i></button>
          </div>
        </div>

        <div class="message" v-if="message">
          <div>{{ message }}</div>
        </div>

        <div class="buttons">
          <button v-on:click.prevent="join" v-bind:disabled="!validated"><i class="fas fa-fw fa-sign-in-alt"></i>Join</button>
          <button v-on:click.prevent="qrscan" v-if="supportsCamera"><i class="fas fa-qrcode"></i> Scan</button>
        </div>
      </form>
    </div>
  </div>

</template>