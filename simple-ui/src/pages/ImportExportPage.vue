<template>
  <q-page padding>
    <div class="q-pa-md q-gutter-sm">
      <p>DataFlow</p>

      <q-btn
        color="secondary"
        label="Save DataFlow"
        @click="saveDataFlow()"
        data-cy="saveDataflow"
      ></q-btn>
    </div>

    <q-separator spaced=""></q-separator>

    <div class="q-pa-md q-gutter-sm">
      <p>Repositories</p>

      <repository-manager></repository-manager>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { api } from '../boot/axios';
import { useQuasar } from 'quasar';
import { getConfig } from 'src/components/utils';
import RepositoryManager from 'src/components/repository/RepositoryManager.vue';
import { useRepoStore } from 'src/stores/repoStore';

const $q = useQuasar();
const repoStore = useRepoStore();

const saveDataFlow = async () => {
  const config = getConfig();
  if (repoStore.currentRepo == null) {
    $q.notify({
      message:
        'No default repository is selected! Mark a repository as default',
      type: 'negative',
    });
    return;
  }
  config['repository'] = repoStore.currentRepo;

  await api
    .post('/config', config)
    .then((res) => {
      $q.notify({
        message:
          'Dataflow: ' +
          res.data['id'] +
          ' saved successfully to ' +
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
</script>
