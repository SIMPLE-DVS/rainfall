<template>
  <q-page>
    <q-splitter class="absolute-full" v-model="splitterModel">
      <template v-slot:before>
        <execution-canvas></execution-canvas>
      </template>
      <template v-slot:separator>
        <q-avatar
          color="primary"
          text-color="white"
          size="40px"
          icon="drag_indicator"
        />
      </template>
      <template v-slot:after>
        <execution-panel> </execution-panel>
      </template>
    </q-splitter>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ExecutionCanvas from '../components/execution/ExecutionCanvas.vue';
import ExecutionPanel from '../components/execution/ExecutionPanel.vue';

const splitterModel = ref(66);
</script>
