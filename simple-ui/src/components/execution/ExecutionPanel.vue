<!--
 Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
 Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 -->

<template>
  <div ref="container">
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
      <q-checkbox
        label="Autoscroll to end"
        :toggle-indeterminate="false"
        v-model="autoScroll"
      ></q-checkbox>
    </div>

    <q-input
      ref="input"
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
import { onUnmounted, Ref, ref } from 'vue';
import { QInput, useQuasar } from 'quasar';
import { destroyWebSocket, getConfig, getWebSocketURL } from '../utils';
import { useLogStore } from 'src/stores/logStore';
import { onBeforeRouteLeave } from 'vue-router';
import { AxiosError } from 'axios';

const $q = useQuasar();
const container: Ref<Element> = ref(null);
const input: Ref<QInput> = ref(null);
const logText = ref('');
const logStore = useLogStore();
const autoScroll = ref(true);
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

const updateTextAndScroll = (line: string) => {
  logText.value += line;

  if (!autoScroll.value) {
    return;
  }

  container.value.scrollIntoView(false);
  input.value.getNativeElement().scrollIntoView(false);
};

const executionListener = (ev: MessageEvent<string>) => {
  const data = ev.data;
  logStore.executionLogLine = data;
  const line = data + (data.endsWith('\n') ? '' : '\n');
  updateTextAndScroll(line);
  // TODO: manage ws exception message or check connection close code
};

const execute = async () => {
  await getConfig(true)
    .then((config) => {
      $q.dialog({
        title: 'Requirements',
        message: 'What are the requirements?',
        prompt: {
          model: (config['dependencies'] as string[]).join('\n'),
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
    .catch((err: AxiosError) => {
      $q.notify({
        message: err.message,
        type: 'negative',
      });
    });
};

onUnmounted(() => {
  destroyWebSocket(socket);
});
</script>
