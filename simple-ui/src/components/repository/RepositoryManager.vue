<template>
  <q-list bordered>
    <q-item-label header>Repositories</q-item-label>

    <q-item v-for="[name, value] in repoStore.repos" :key="name">
      <q-item-section avatar top>
        <q-btn
          size="12px"
          outline
          icon="folder_open"
          label="Open"
          title="List repository content"
          @click="openRepositoryDialog(name)"
        />
      </q-item-section>

      <q-item-section top>
        <q-item-label lines="1">
          <span class="text-weight-medium">{{ name }}</span>
        </q-item-label>
        <q-item-label caption lines="1">
          {{ value.type }} repository
        </q-item-label>
      </q-item-section>

      <q-item-section v-if="repoStore.currentRepo == name" side top>
        <div>
          <q-icon size="24px" name="done"></q-icon>
          Use by default
        </div>
      </q-item-section>
      <q-item-section top side>
        <div class="text-grey-8 q-gutter-xs">
          <q-btn
            size="12px"
            flat
            dense
            round
            icon="archive"
            title="Archive repository"
            @click="deleteRepo(name, true)"
          />
          <q-btn
            size="12px"
            flat
            dense
            round
            icon="delete"
            title="Delete repository"
            @click="deleteRepo(name, false)"
          />
          <q-btn
            v-if="repoStore.currentRepo != name"
            size="12px"
            flat
            dense
            round
            icon="done"
            title="Mark as Default"
            @click="markAsDefault(name)"
          />
        </div>
      </q-item-section>
    </q-item>
  </q-list>

  <q-btn icon="add" outline @click="addRepo"></q-btn>

  <q-list bordered>
    <q-item-label header>Archived Repositories</q-item-label>

    <q-item v-for="[name, value] in repoStore.archivedRepos" :key="name">
      <q-item-section avatar top>
        <q-icon name="archive" color="black" size="34px" />
      </q-item-section>

      <q-item-section top>
        <q-item-label lines="1">
          <span class="text-weight-medium">{{ name }}</span>
        </q-item-label>
        <q-item-label caption lines="1">
          {{ value.type }} repository
        </q-item-label>
      </q-item-section>

      <q-item-section top side>
        <div class="text-grey-8 q-gutter-xs">
          <q-btn
            class="gt-xs"
            size="12px"
            flat
            dense
            round
            icon="unarchive"
            @click="unarchiveRepo(name)"
          />
          <q-btn
            class="gt-xs"
            size="12px"
            flat
            dense
            round
            icon="delete"
            @click="deleteArchivedRepo(name)"
          />
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRepoStore } from 'stores/repoStore';
import { api } from '../../boot/axios';
import { Repository } from '../models';
import RepositoryDialog from './RepositoryDialog.vue';
import { AxiosError, AxiosResponse } from 'axios';

const $q = useQuasar();
const repoStore = useRepoStore();

onMounted(async () => {
  await Promise.all([
    api.get<string[]>('/repositories'),
    api.get<string[]>('/repositories/archived'),
  ])
    .then((res) => {
      repoStore.repos = new Map<string, Repository>(
        res[0].data.map((r) => [r, { name: r, type: 'local' }])
      );
      repoStore.archivedRepos = new Map<string, Repository>(
        res[1].data.map((r) => [r, { name: r, type: 'local' }])
      );
      if (repoStore.repos.size > 0) {
        repoStore.currentRepo = [...repoStore.repos.values()][0].name;
      }
    })
    .catch((error: AxiosError) => {
      $q.notify({ message: error.message, type: 'negative' });
    });
});

const addRepo = () => {
  $q.dialog({
    title: 'Add a new repository',
    message: 'What is the new name of the repository?',
    prompt: {
      model: '',
      isValid: (name) => {
        return name.trim() != '' && !repoStore.repos.has(name.trim());
      },
      type: 'text',
      outlined: true,
    },
    cancel: true,
  }).onOk((repoName) => {
    api
      .post('/repositories/' + repoName)
      .then(() => {
        repoStore.repos.set(repoName, { name: repoName, type: 'local' });
        if (repoStore.repos.size == 1) {
          repoStore.currentRepo = [...repoStore.repos.values()][0].name;
        }
      })
      .catch((error) => $q.notify({ message: error, type: 'negative' }));
  });
};

const deleteRepo = (repoName: string, shallow: boolean) => {
  $q.dialog({
    title: (shallow ? 'Archive' : 'Delete') + ' a repository',
    message:
      'Are you sure you want to ' +
      (shallow ? 'archive' : 'delete') +
      ' the repository: ' +
      repoName +
      '?',
    cancel: true,
  }).onOk(() => {
    api
      .delete('/repositories/' + repoName, {
        params: {
          shallow: shallow,
        },
      })
      .then(() => {
        repoStore.repos.delete(repoName);
        if (repoStore.repos.size == 1) {
          repoStore.currentRepo = [...repoStore.repos.values()][0].name;
        }
        if (repoStore.repos.size == 0) {
          repoStore.currentRepo = null;
        }
        if (shallow) {
          repoStore.archivedRepos.set(repoName, {
            name: repoName,
            type: 'local',
          });
        }
      })
      .catch((error) => $q.notify({ message: error, type: 'negative' }));
  });
};

const deleteArchivedRepo = (repoName: string) => {
  $q.dialog({
    title: 'Delete an archived repository',
    message:
      'Are you sure you want to delete the archived repository: ' +
      repoName +
      '?',
    cancel: true,
  }).onOk(() => {
    api
      .delete('/repositories/archived/' + repoName)
      .then(() => {
        repoStore.archivedRepos.delete(repoName);
      })
      .catch((error) => $q.notify({ message: error, type: 'negative' }));
  });
};

const unarchiveRepo = (repoName: string) => {
  $q.dialog({
    title: 'Unarchive an archived repository',
    message:
      'Are you sure you want to unarchive the archived repository: ' +
      repoName +
      '?',
    cancel: true,
  }).onOk(() => {
    api
      .post('/repositories/archived/' + repoName)
      .then(() => {
        repoStore.archivedRepos.delete(repoName);
        repoStore.repos.set(repoName, { name: repoName, type: 'local' });
        if (repoStore.repos.size == 1) {
          repoStore.currentRepo = [...repoStore.repos.values()][0].name;
        }
      })
      .catch((error) => $q.notify({ message: error, type: 'negative' }));
  });
};

const markAsDefault = (repoName: string) => {
  $q.dialog({
    title: 'Confirm',
    message:
      'Are you sure you want to mark the repository: ' +
      repoName +
      ' as default?',
    cancel: true,
  }).onOk(() => {
    repoStore.currentRepo = repoName;
  });
};

const openRepositoryDialog = async (repoName: string) => {
  await api
    .get('/repositories/' + repoName)
    .then((res: AxiosResponse) => {
      const dataflows: [string, number][] = res.data['content'];
      dataflows.sort((a, b) => b[1] - a[1]);
      if (dataflows.length == 0) {
        $q.notify({
          message: 'No dataflows available in the repository: ' + repoName,
          type: 'negative',
        });
      } else {
        $q.dialog({
          component: RepositoryDialog,
          componentProps: { repoName, dataflows },
        });
      }
    })
    .catch((err: AxiosError) => {
      $q.notify({
        message: (err.response.data as { message: string }).message,
        type: 'negative',
      });
    });
};
</script>
