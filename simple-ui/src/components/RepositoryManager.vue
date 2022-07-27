<template>
  <q-list bordered>
    <q-item-label header>Repositories</q-item-label>

    <q-item v-for="[name, value] in repoStore.repos" :key="name">
      <q-item-section avatar top>
        <q-icon name="computer" color="black" size="34px" />
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
            class="gt-xs"
            size="12px"
            flat
            dense
            round
            icon="delete"
            @click="deleteRepo(name)"
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
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRepoStore } from 'stores/repoStore';
import { api } from '../boot/axios';
import { Repository } from './models';

export default defineComponent({
  name: 'RepositoryManager',

  setup() {
    const $q = useQuasar();
    const repoStore = useRepoStore();

    onMounted(async () => {
      const repos = await api.get<string[]>('/repositories');
      repoStore.repos = new Map<string, Repository>(
        repos.data.map((r) => [r, { name: r, type: 'local' }])
      );
      if (repoStore.repos.size > 0) {
        repoStore.currentRepo = [...repoStore.repos.values()][0].name;
      }
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

    const deleteRepo = (repoName: string) => {
      $q.dialog({
        title: 'Delete a repository',
        message:
          'Are you sure you want to delete the repository: ' + repoName + '?',
        cancel: true,
      }).onOk(() => {
        api
          .delete('/repositories/' + repoName, {
            params: {
              shallow: false,
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

    return {
      repoStore,
      addRepo,
      deleteRepo,
      markAsDefault,
    };
  },
});
</script>
