<template>
  <q-page>
    <d-3-canvas></d-3-canvas>
  </q-page>
</template>

<script lang="ts">
import D3Canvas from '../components/D3Canvas.vue';

export default {
  components: { D3Canvas },

  name: 'PageD3',
};
</script>
