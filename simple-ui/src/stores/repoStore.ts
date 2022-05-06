import { defineStore } from 'pinia';
import { Repository } from 'src/components/models';

export const useRepoStore = defineStore('repo', {
  state: () => ({
    repos: new Map<string, Repository>(),
    currentRepo: null as string,
  }),
});
