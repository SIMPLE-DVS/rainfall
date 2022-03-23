<template>
  <q-dialog
    persistent
    full-width
    full-height
    @show="
      code = customStore.code;
      functionName = customStore.function_name;
    "
  >
    <q-card>
      <q-card-section class="row items-center">
        Code Editor
        <q-space />
        <q-input
          :disable="customStore.editMode"
          dense
          outlined
          v-model="customStore.name"
          label="My Custom Node Name"
          lazy-rules
          :rules="[
            (val) => (val != null && val.trim() !== '') || 'Field is required',
          ]"
        >
        </q-input>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          v-close-popup
          @click="
            customStore.editMode = false;
            customStore.nodeToEdit = null;
          "
        />
      </q-card-section>
      <q-card-section>
        <prism-editor
          class="my-editor"
          v-model="code"
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
          v-model="functionName"
          :options="options"
          label="Function Name"
        />
        <q-btn
          :disable="
            customStore.name == null ||
            customStore.name.trim() == '' ||
            functionName == null
          "
          color="primary"
          label="create custom node"
          @click="
            checkCustomNode().then((res) => {
              if (res) {
                $emit('onCreateCustomNode');
              }
            })
          "
        ></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { useCustomStore } from 'stores/customStore';
import { api } from 'src/boot/axios';
import { debounce, Notify } from 'quasar';
import { AxiosError, AxiosResponse } from 'axios';

export default defineComponent({
  name: 'CustomNodeDialog',

  components: { PrismEditor },

  emits: ['onCreateCustomNode'],

  setup() {
    const customStore = useCustomStore();
    const code = ref(customStore.code);
    const options = ref([]);
    const functionName = ref(customStore.function_name);

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
      customStore.code = code.value;
      options.value = getMatches(code.value);
      if (!options.value.includes(functionName.value)) {
        functionName.value = null;
      }
    }, 500);

    function highlighter(code: string) {
      return highlight(code, languages.python, 'python');
    }

    async function checkCustomNode(): Promise<boolean> {
      let retVal = false;
      await api
        .post('/custom/check', {
          function_name: functionName.value,
          code: code.value,
        })
        .then((res: AxiosResponse) => {
          console.log(res.data);
          const data = res.data as {
            inputs: string[];
            outputs: string[];
            parameters: string[];
          };

          customStore.inputs = data.inputs;
          customStore.outputs = data.outputs;
          customStore.parameters = data.parameters;
          customStore.function_name = functionName.value;

          retVal = true;
        })
        .catch((err: AxiosError) => {
          Notify.create({
            message: (err.response.data as { message: string }).message,
            position: 'top',
            type: 'negative',
          });
          retVal = false;
        });
      return retVal;
    }

    return {
      code,
      options,
      customStore,
      functionName,
      highlighter,
      slide: ref(1),
      debouncedCodeChanged,
      checkCustomNode,
    };
  },
});
</script>

<style>
.my-editor {
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
