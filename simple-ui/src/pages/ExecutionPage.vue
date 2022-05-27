<template>
  <q-page>
    <execution-canvas></execution-canvas>
  </q-page>
</template>

<script lang="ts">
import ExecutionCanvas from '../components/execution/ExecutionCanvas.vue';

export default {
  name: 'PageExecution',

  components: { ExecutionCanvas },
};
</script>
