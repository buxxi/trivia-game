<template>
  <div class="attribution">
    <h1><i class="fas fa-fw fa-heart" style="color : #aa0000"></i>{{ $t('poweredBy') }}</h1>
    <ul class="carousel">
      <li v-for="(site, index) in attributions" v-bind:class="{show : index === carouselIndex}"><a v-bind:href="site.url">{{ site.name }}</a></li>
    </ul>
  </div>
</template>

<script>
export default {
  data: function () {
    return {
      carouselIndex: 0,
      carouselTimeout: 0
    }
  },
  props: ['attributions'],
  mounted() {
    let app = this;
    function moveCarousel() {
      app.carouselTimeout = setInterval(() => {
        app.carouselIndex = (app.carouselIndex + 1) % app.attributions.length;
      }, 5000);
    }

    moveCarousel();
  },
  unmounted() {
    clearInterval(this.carouselTimeout);
  }
}
</script>
