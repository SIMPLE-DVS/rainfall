<template>
  <q-page padding>
    <div class="q-pa-md q-gutter-sm">
      <p>DataFlow</p>

      <q-btn color="secondary" label="Save DataFlow" @click="getZip()"></q-btn>
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
import { api } from '../boot/axios';
import { QFile, useQuasar } from 'quasar';
import RepositoryManager from 'src/components/repository/RepositoryManager.vue';
import { getConfig } from 'src/components/utils';

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

    return {
      filePicker,
      file,
      getZip,
    };
  },
};
</script>
