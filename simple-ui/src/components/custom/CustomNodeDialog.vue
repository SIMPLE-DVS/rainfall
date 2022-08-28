<template>
  <q-dialog ref="dialogRef">
    <q-card>
      <q-form
        @submit="onOKClick"
        class="q-pa-sm"
        style="display: flex; flex-direction: column; align-items: center"
      >
        Custom Node
        <q-card-section class="column items-center">
          <q-input
            style="width: 300px"
            dense
            outlined
            v-model="structure.clazz"
            label="My Custom Node Name"
            lazy-rules
            :rules="[
              (val) =>
                (val != null && val.trim() !== '') || 'Field is required',
              (val) =>
                !customNodeExists(val) || 'Custom node name already exists',
            ]"
            data-cy="customNodeName"
          >
          </q-input>
          <q-select
            style="width: 300px"
            dense
            outlined
            v-model="structure.function_name"
            :options="options"
            label="Function Name"
            lazy-rules
            :rules="[
              (val) => val != null || 'Field is required',
              (val) =>
                !customFunctionExists(val) ||
                'Function already defined in another custom node',
            ]"
          />
        </q-card-section>
        <q-btn
          type="submit"
          color="primary"
          label="Create custom node"
          data-cy="createCustomNode"
        ></q-btn>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, toRaw } from 'vue';
import { api } from 'src/boot/axios';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { AxiosError, AxiosResponse } from 'axios';
import { CustomNodeStructure, SimpleNodeParameter } from '../models';
import { useConfigStore } from 'src/stores/configStore';

const props = defineProps<{
  editorInfo: {
    package: string;
    code: string;
  };
}>();

defineEmits(useDialogPluginComponent.emitsObject);

const $q = useQuasar();
const configStore = useConfigStore();
const { dialogRef, onDialogOK } = useDialogPluginComponent();

const structure: CustomNodeStructure = reactive({
  package: toRaw(props.editorInfo.package),
  clazz: null,
  input: {},
  output: {},
  parameter: [],
  methods: null,
  tags: {
    library: 'Base',
    type: 'Custom',
  },
  description: 'A Custom Node.',
  function_name: null,
  code: toRaw(props.editorInfo.code),
} as CustomNodeStructure);

if (structure.package != null) {
  const nodeStructure = configStore.getNodeStructureByNodePackage(
    structure.package
  ) as CustomNodeStructure;
  structure.clazz = nodeStructure.clazz;
}

const getMatches = (str: string) => {
  const regex = /def (.+?)\(.+?,.+?\):/gm;
  const matches = [] as string[];

  let m;
  while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    matches.push(m[1]);
  }

  return matches;
};

const options = ref(getMatches(structure.code));
if (options.value.length == 1) {
  structure.function_name = options.value[0];
}

const onOKClick = async () => {
  await api
    .post('/nodes/custom', {
      function_name: structure.function_name,
      code: structure.code,
    })
    .then((res: AxiosResponse) => {
      const data = res.data as {
        inputs: string[];
        outputs: string[];
        params: string[];
      };

      structure.clazz = structure.clazz.replace(/\s/g, '');
      structure.input = data.inputs.reduce(
        (acc, value) => Object.assign(acc, { [value]: 'custom' }),
        {}
      );
      structure.output = data.outputs.reduce(
        (acc, value) => Object.assign(acc, { [value]: 'custom' }),
        {}
      );
      structure.parameter = data.params.map((p) => {
        return {
          name: p,
          type: 'Any',
          is_mandatory: false,
          description: 'Custom Parameter: ' + p,
          default_value: null,
        } as SimpleNodeParameter;
      });
      onDialogOK(toRaw(structure));
    })
    .catch((err: AxiosError) => {
      $q.notify({
        message: (err.response.data as { message: string }).message,
        type: 'negative',
      });
    });
};

const customNodeExists = (name: string) => {
  return [...configStore.nodeStructures.values()]
    .filter((n) => n.package != structure.package)
    .map((n) => n.clazz.toLowerCase())
    .includes(name.replace(/\s/g, '').toLowerCase());
};

const customFunctionExists = (name: string) => {
  return [...configStore.nodeStructures.values()]
    .filter((n) => n.package != structure.package)
    .map((n) => (n as CustomNodeStructure).function_name)
    .includes(name);
};
</script>
