import { defineStore } from 'pinia';
import { NodeInfo } from 'src/components/models';

export const useCustomStore = defineStore('custom', {
  state: () => ({
    nodeToEdit: null as NodeInfo,
  }),
});
