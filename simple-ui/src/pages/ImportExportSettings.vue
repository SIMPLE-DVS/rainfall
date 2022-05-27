<template>
  <q-page padding>
    <div class="q-pa-md q-gutter-sm">
      <p>UI File</p>

      <q-file
        ref="filePicker"
        class="fit-content"
        style="display: none"
        accept=".json"
        v-model="file"
        @update:model-value="loadUI()"
      ></q-file>
      <q-btn
        color="secondary"
        icon="upload"
        label="Load"
        @click="filePicker.pickFiles()"
      ></q-btn>
      <q-btn color="secondary" icon="download" label="Save" @click="saveUI()">
      </q-btn>
    </div>

    <q-separator spaced=""></q-separator>

    <div class="q-pa-md q-gutter-sm">
      <p>Zip File</p>

      <q-btn color="secondary" label="Download ZIP" @click="getZip()"></q-btn>
    </div>

    <q-separator spaced=""></q-separator>

    <div class="q-pa-md q-gutter-sm">
      <p>Repositories</p>

      <repository-manager></repository-manager>
    </div>
  </q-page>
</template>

<script lang="ts">
import { ref, Ref } from 'vue';
import { useCanvasStore } from 'stores/canvasStore';
import { useConfigStore } from 'stores/configStore';
import { api } from '../boot/axios';
import { exportFile, QFile, useQuasar } from 'quasar';
import { UIFile } from 'src/components/d3/types';
import RepositoryManager from 'src/components/RepositoryManager.vue';
import { getUI, getConfig } from 'src/components/utils';

export default {
  name: 'PageImportExport',

  components: { RepositoryManager },

  setup() {
    const $q = useQuasar();
    const filePicker: Ref<QFile> = ref(null);
    const file: Ref<File> = ref(null);

    const getZip = async () => {
      const config = getConfig();
      await api
        .post('/config', config)
        .then((res) => {
          $q.notify({
            message:
              'Dataflow: ' +
              res.data['id'] +
              ' salvato con successo in ' +
              res.data['uri'],
            type: 'positive',
          });
        })
        .catch((error: Error) => {
          $q.notify({
            message: error.message,
            type: 'negative',
          });
        });
    };

    const loadUI = () => {
      const canvasStore = useCanvasStore();
      const configStore = useConfigStore();

      const fileValue = file.value;
      const reader = new FileReader();
      if (fileValue.name.includes('.json')) {
        reader.onload = (res) => {
          const uiFile = JSON.parse(res.target.result as string) as UIFile;
          configStore.nodeStructures = new Map(uiFile.structures);
          configStore.nodeConfigs = new Map(uiFile.configs);
          configStore.nodeAnyConfigs = new Map(uiFile.anyConfigs);
          canvasStore.canvasNodes = new Map(uiFile.nodes);
          canvasStore.canvasEdges = new Map(uiFile.edges);
          canvasStore.canvasTransform = uiFile.transform;
        };
        reader.onerror = (err) => {
          console.log('ERROR DURING LOAD');
          console.log(err);
        };
        reader.readAsText(fileValue, 'utf8');
      }
    };

    const saveUI = () => {
      const uiState = getUI();

      const status = exportFile('ui.json', JSON.stringify(uiState), {
        mimeType: 'application/json',
        encoding: 'utf-8',
      });

      if (status) {
        console.log('SAVED');
      } else {
        console.log('ERROR DURING SAVE');
        console.log((status as Error).message);
      }
    };

    return {
      filePicker,
      file,
      getZip,
      loadUI,
      saveUI,
    };
  },
};
</script>
