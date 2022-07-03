import { defineStore } from 'pinia';

export const useLogStore = defineStore('log', {
  state: () => ({
    executionLogLine: null as string,
  }),
});
