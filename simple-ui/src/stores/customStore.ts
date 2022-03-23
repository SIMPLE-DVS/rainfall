import { defineStore } from 'pinia';

export const useCustomStore = defineStore('custom', {
  state: () => ({
    nodeToEdit: null as string,
    editMode: false,
    name: 'My Custom Node',
    inputs: [] as string[],
    outputs: [] as string[],
    parameters: [] as string[],
    packages: [] as string[],
    function_name: null as string,
    code: "print('OK')",
  }),
});
