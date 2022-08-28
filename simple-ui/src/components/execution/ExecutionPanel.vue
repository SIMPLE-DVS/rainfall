<template>
  <div class="column items-center">
    <q-item-label header class="row justify-center">Execution</q-item-label>
    <q-btn
      class="q-pa-sm"
      icon="play_arrow"
      color="primary"
      label="Execute"
      @click="execute()"
      data-cy="executionButton"
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
      data-cy="log"
    ></q-input>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { destroyWebSocket, getConfig, getWebSocketURL } from '../utils';
import { useLogStore } from 'src/stores/logStore';

const $q = useQuasar();
const logText = ref('');
const logStore = useLogStore();
let socket: WebSocket = null;

const executionListener = (ev: MessageEvent<string>) => {
  const data = ev.data;
  logStore.executionLogLine = data;
  const line = data + (data.endsWith('\n') ? '' : '\n');
  logText.value += line;
  // TODO: manage ws exception message or check connection close code
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
    const config = getConfig();
    if (config == null) {
      return;
    }
    socket = new WebSocket(getWebSocketURL() + '/execution');
    socket.onopen = () => {
      socket.onmessage = executionListener;
      logText.value = '';
      config['path'] = path;
      socket.send(JSON.stringify(config));
    };
  });
};

onUnmounted(() => {
  destroyWebSocket(socket);
});
</script>
