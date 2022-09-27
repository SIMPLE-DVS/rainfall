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
import {
  destroyWebSocket,
  getConfig,
  getNodesRequirements,
  getWebSocketURL,
} from '../utils';
import { useLogStore } from 'src/stores/logStore';
import { api } from 'src/boot/axios';
import { useCanvasStore } from 'src/stores/canvasStore';
import { useConfigStore } from 'src/stores/configStore';
import { onBeforeRouteLeave } from 'vue-router';

const $q = useQuasar();
const logText = ref('');
const logStore = useLogStore();
let socket: WebSocket = null;

onBeforeRouteLeave((_to, _from, next) => {
  if (socket == null || socket.readyState == WebSocket.CLOSED) {
    next();
    return;
  }
  $q.dialog({
    message: 'Are you sure you want to leave the page and stop the execution?',
    cancel: true,
  })
    .onOk(() => {
      destroyWebSocket(socket);
      next();
    })
    .onCancel(() => next(false));
});

const executionListener = (ev: MessageEvent<string>) => {
  const data = ev.data;
  logStore.executionLogLine = data;
  const line = data + (data.endsWith('\n') ? '' : '\n');
  logText.value += line;
  // TODO: manage ws exception message or check connection close code
};

const execute = async () => {
  const canvasStore = useCanvasStore();
  const configStore = useConfigStore();
  const config = getConfig();
  if (config == null) {
    return;
  }

  await api
    .post<string[]>('/execution', {
      libs: getNodesRequirements(),
      ui_nodes: [...canvasStore.canvasNodes.values()],
      ui_structures: Object.fromEntries([
        ...configStore.nodeStructures.entries(),
      ]),
    })
    .then((res) => {
      $q.dialog({
        title: 'Requirements',
        message: 'What are the requirements?',
        prompt: {
          model: res.data.join('\n'),
          isValid: (val) => {
            return val.trim() != '';
          },
          type: 'textarea',
          outlined: true,
        },
        cancel: true,
      }).onOk((requirements: string) => {
        $q.dialog({
          title: 'Path of execution',
          message: 'What is the path in which the script will run?',
          prompt: {
            model: '',
            isValid: (val) => {
              return val.trim() != '';
            },
            type: 'text',
            outlined: true,
          },
          cancel: true,
        }).onOk((path) => {
          config['dependencies'] = requirements.split('\n');

          socket = new WebSocket(getWebSocketURL() + '/execution');
          socket.onopen = () => {
            socket.onmessage = executionListener;
            logText.value = '';
            config['path'] = path;
            socket.send(JSON.stringify(config));
          };
        });
      });
    })
    .catch(() => {
      $q.notify({
        message: 'Error while determining requirements!',
        type: 'negative',
      });
    });
};

onUnmounted(() => {
  destroyWebSocket(socket);
});
</script>
