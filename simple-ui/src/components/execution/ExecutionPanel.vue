<template>
  <div class="column items-center">
    <q-item-label header class="row justify-center">Execution</q-item-label>
    <q-btn
      class="q-pa-sm"
      icon="play_arrow"
      color="primary"
      label="Execute"
      @click="execute()"
    ></q-btn>
    <div class="q-pt-md">Execution Log</div>
  </div>
  <div style="position: relative">
    <q-input
      class="q-pa-md"
      v-model="logText"
      autogrow
      readonly
      outlined
    ></q-input>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useQuasar } from 'quasar';
import { getConfig } from '../utils';
import { socket } from 'src/boot/socket';

export default defineComponent({
  name: 'ExecutionPanel',

  setup() {
    const $q = useQuasar();
    const logText = ref('');

    const executionListener = (event: string) => {
      const line = event + (event.endsWith('\n') ? '' : '\n');
      logText.value += line;
    };

    const execute = async () => {
      $q.dialog({
        title: 'Path of execution',
        message: 'What is the path in which the script will run?',
        prompt: {
          model: '',
          isValid: (name) => {
            return name.trim() != '';
          },
          type: 'text',
          outlined: true,
        },
        cancel: true,
      }).onOk((path) => {
        logText.value = '';
        socket.off('execution', executionListener);
        socket.on('execution', executionListener);
        const config = getConfig();
        config['path'] = path;
        socket.emit('execution', config);
      });
    };

    return {
      logText,
      execute,
    };
  },
});
</script>
