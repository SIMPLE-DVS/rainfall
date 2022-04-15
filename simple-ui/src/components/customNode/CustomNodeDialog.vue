<template>
  <q-dialog ref="dialogRef" persistent full-width full-height>
    <q-card>
      <q-card-actions align="right">
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-actions>
      <q-card-section class="column items-center">
        Code Editor
        <q-input
          :disable="node != null"
          dense
          outlined
          v-model="customNodeInfo.name"
          label="My Custom Node Name"
          lazy-rules
          :rules="[
            (val) => (val != null && val.trim() !== '') || 'Field is required',
          ]"
        >
        </q-input>
      </q-card-section>
      <q-card-section>
        <prism-editor
          class="editor"
          v-model="customNodeInfo.code"
          :highlight="highlighter"
          lineNumbers
          autoStyleLineNumbers
          :tabSize="4"
          insertSpaces
          @input="debouncedCodeChanged()"
          placeholder="# some code"
        ></prism-editor>
      </q-card-section>
      <q-card-actions align="center">
        <q-select
          style="width: 300px"
          class="q-pr-md"
          dense
          outlined
          v-model="customNodeInfo.function"
          :options="options"
          label="Function Name"
        />
        <q-btn
          :disable="
            customNodeInfo.name == null ||
            customNodeInfo.name.trim() == '' ||
            customNodeInfo.function == null
          "
          color="primary"
          label="create custom node"
          @click="onOKClick()"
        ></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref, toRefs, toRaw } from 'vue';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { api } from 'src/boot/axios';
import { debounce, useDialogPluginComponent, useQuasar } from 'quasar';
import { AxiosError, AxiosResponse } from 'axios';
import { CustomNodeInfo, CustomNodeStructure, NodeInfo } from '../models';
import { useConfigStore } from 'src/stores/configStore';

export default defineComponent({
  name: 'CustomNodeDialog',

  components: { PrismEditor },

  emits: { ...useDialogPluginComponent.emitsObject },

  props: {
    node: {
      type: Object as PropType<NodeInfo>,
      required: false,
    },
  },

  setup(props) {
    const $q = useQuasar();

    const { dialogRef, onDialogOK } = useDialogPluginComponent();

    const customNodeInfo = reactive({
      name: 'My Custom Node',
      package: '',
      clazz: '',
      inputs: [],
      outputs: [],
      parameters: [],
      packages: [],
      function: null,
      code: "print('OK')",
      editMode: false,
    } as CustomNodeInfo);

    if (props.node) {
      const nodeInfo = toRefs(props.node);
      customNodeInfo.package = nodeInfo.package.value;
      const configStore = useConfigStore();
      const nodeStructure = configStore.getNodeStructureByNodePackage(
        customNodeInfo.package
      ) as CustomNodeStructure;
      customNodeInfo.name = nodeStructure.name;
      customNodeInfo.clazz = nodeStructure.clazz;
      customNodeInfo.function = nodeStructure.function_name;
      customNodeInfo.code = nodeStructure.code;
      customNodeInfo.editMode = true;
    }

    const options = ref([]);

    function getMatches(str: string) {
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
    }

    const debouncedCodeChanged = debounce(() => {
      options.value = getMatches(customNodeInfo.code);
      if (!options.value.includes(customNodeInfo.function)) {
        customNodeInfo.function = null;
      }
    }, 500);

    function highlighter(code: string) {
      return highlight(code, languages.python, 'python');
    }

    const onOKClick = async () => {
      await checkCustomNode().then(() => {
        onDialogOK(toRaw(customNodeInfo));
      });
    };

    async function checkCustomNode(): Promise<boolean> {
      let retVal = false;
      await api
        .post('/custom/check', {
          function_name: customNodeInfo.function,
          code: customNodeInfo.code,
        })
        .then((res: AxiosResponse) => {
          const data = res.data as {
            inputs: string[];
            outputs: string[];
            parameters: string[];
          };

          customNodeInfo.clazz = customNodeInfo.name.replace(/\s/g, '');
          customNodeInfo.inputs = data.inputs;
          customNodeInfo.outputs = data.outputs;
          customNodeInfo.parameters = data.parameters;
          retVal = true;
        })
        .catch((err: AxiosError) => {
          $q.notify({
            message: (err.response.data as { message: string }).message,
            type: 'negative',
          });
          retVal = false;
        });
      return retVal;
    }

    return {
      dialogRef,
      onOKClick,
      customNodeInfo,
      options,
      highlighter,
      debouncedCodeChanged,
      checkCustomNode,
    };
  },
});
</script>

<style>
.editor {
  background: #2d2d2d;
  color: #ccc;

  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 5px;
}

.prism-editor__textarea:focus {
  outline: none;
}
</style>
