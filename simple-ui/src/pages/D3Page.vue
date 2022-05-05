<template>
  <q-page>
    <d-3-canvas></d-3-canvas>
  </q-page>
</template>

<script lang="ts">
import D3Canvas from '../components/d3/D3Canvas.vue';

export default {
  name: 'PageD3',

  components: { D3Canvas },
};
</script>
