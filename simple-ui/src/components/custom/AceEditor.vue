<template>
  <q-splitter
    horizontal
    :limits="[10, 100]"
    class="absolute-full"
    v-model="splitterModel"
  >
    <template v-slot:before>
      <div class="row full-height text-center items-center">
        <div class="col">
          <q-btn
            flat
            icon="settings"
            @click="openSettingsMenu"
            label="Editor Settings"
          ></q-btn>
        </div>
        <div class="col" style="font-size: 24px">Custom Node Editor</div>
        <div class="col">
          <div class="row">
            <div class="col">
              <q-btn
                label="New Custom Node"
                color="primary"
                @click="newCustomNode"
                data-cy="newCustomNode"
              ></q-btn>
            </div>
            <div class="col">
              <q-btn
                label="Save Custom Node"
                color="primary"
                @click="saveCustomNode"
                data-cy="saveCustomNode"
              ></q-btn>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-slot:after>
      <div
        ref="editorRef"
        class="full-height full-width"
        style="position: relative"
        @dragover="allowDrop($event)"
        @drop="drop($event)"
        data-cy="editor"
      ></div>
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import Ace from 'ace-builds';
import 'ace-builds/src-min-noconflict/theme-one_dark';
import 'ace-builds/src-min-noconflict/mode-python';
import 'ace-builds/src-min-noconflict/mode-r';
import 'ace-builds/src-min-noconflict/mode-julia';
import 'ace-builds/src-min-noconflict/snippets/python';
import 'ace-builds/src-min-noconflict/snippets/r';
import 'ace-builds/src-min-noconflict/snippets/julia';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import 'ace-builds/src-min-noconflict/ext-searchbox';
import 'ace-builds/src-min-noconflict/ext-prompt';
import 'ace-builds/src-min-noconflict/ext-settings_menu';
import { useConfigStore } from 'src/stores/configStore';
import { CustomNodeStructure, SimpleNodeParameter } from '../models';
import CustomNodeDialog from './CustomNodeDialog.vue';
import { useCanvasStore } from 'src/stores/canvasStore';

// TODO: import only needed languages and themes,
// avoid prompt and settings showing all the others
const props = defineProps<{
  nodePackage?: string;
}>();

const $q = useQuasar();
const configStore = useConfigStore();
const canvasStore = useCanvasStore();
const splitterModel = ref(10);
const editorRef = ref(null);
let editor: Ace.Ace.Editor = null;
let nodePackage: string = null;

onMounted(() => {
  editor = Ace.edit(editorRef.value, {
    placeholder: '# Some code',
    wrap: true,
    showPrintMargin: false,
    fontSize: 24,
    highlightActiveLine: true,
    highlightGutterLine: true,
    highlightSelectedWord: true,
  });
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
  });
  editor.setTheme('ace/theme/one_dark');
  editor.getSession().setMode('ace/mode/python');
  Ace.require('ace/ext/settings_menu').init(editor);

  if (props != null) {
    setCustomNodeInfo(props.nodePackage);
  }
});

const openSettingsMenu = () => {
  editor.execCommand('showSettingsMenu');
};

const allowDrop = (e: DragEvent) => {
  e.preventDefault();
};

const drop = (e: DragEvent) => {
  e.preventDefault();
  const nodePackage = e.dataTransfer.getData('text');
  const configStore = useConfigStore();
  if (
    nodePackage != 'rain.nodes.custom.custom.CustomNode' &&
    nodePackage.includes('rain.nodes.custom.custom.CustomNode') &&
    configStore.nodeStructures.has(nodePackage)
  ) {
    e.stopImmediatePropagation();
    setCustomNodeInfo(nodePackage);
  }
};

const setCustomNodeInfo = (nodePackageInfo: string) => {
  if (
    !configStore.nodeStructures.has(nodePackageInfo) ||
    nodePackageInfo == 'rain.nodes.custom.custom.CustomNode' ||
    !nodePackageInfo.includes('rain.nodes.custom.custom.CustomNode')
  ) {
    return;
  }
  nodePackage = nodePackageInfo;
  const structure = configStore.nodeStructures.get(
    nodePackage
  ) as CustomNodeStructure;
  editor.setValue(structure.code);
};

const newCustomNode = () => {
  nodePackage = null;
  editor.setValue('');
};

const saveCustomNode = () => {
  const editorInfo = {
    package: configStore.nodeStructures.has(nodePackage) ? nodePackage : null,
    code: editor.getValue(),
  };
  const language = (
    editor.getSession().getMode() as unknown as { $id: string }
  ).$id.substring('ace/mode/'.length);

  $q.dialog({
    component: CustomNodeDialog,
    componentProps: { editorInfo, language },
  }).onOk((res: CustomNodeStructure) => {
    if (res.package == null) {
      res.package = getNextCustomNodeStructureId();
      configStore.addNodeStructure(res);
      nodePackage = res.package;
    } else {
      const structure = configStore.getNodeStructureByNodePackage(
        res.package
      ) as CustomNodeStructure;
      structure.clazz = res.clazz;
      structure.function_name = res.function_name;
      structure.code = res.code;

      const nodesWithSamePackage = [...canvasStore.canvasNodes.values()]
        .filter((n) => n.package == res.package)
        .map((n) => n.name);
      const oldParameters = structure.parameter.map((p) => p.name);
      const newParameters = res.parameter.map((p) => p.name);
      const parametersToRemove = oldParameters.filter(
        (p) => !newParameters.includes(p)
      );
      const parametersToAdd = newParameters.filter(
        (p) => !oldParameters.includes(p)
      );
      nodesWithSamePackage.forEach((n) => {
        const nodeConfig = configStore.nodeConfigs.get(n);
        parametersToRemove.forEach((p) => {
          delete nodeConfig[p];
          configStore.nodeAnyConfigs.delete(n + '$' + p);
        });
        parametersToAdd.forEach((p) => {
          nodeConfig[p] = null;
          configStore.nodeAnyConfigs.set(n + '$' + p, 'str');
        });
      });
      structure.parameter = structure.parameter.filter(
        (p) => !parametersToRemove.includes(p.name)
      );
      structure.parameter.push(
        ...parametersToAdd.map((p) => {
          return {
            name: p,
            type: 'Any',
            is_mandatory: false,
            description: 'Custom Parameter: ' + p,
            default_value: null,
          } as SimpleNodeParameter;
        })
      );

      const inputs = {
        old: Object.keys(structure.input),
        new: Object.keys(res.input),
      };
      const outputs = {
        old: Object.keys(structure.output),
        new: Object.keys(res.output),
      };
      const io = [inputs, outputs];
      io.forEach((d, i) => {
        const toRemove = d.old.filter((r) => !d.new.includes(r));
        const toAdd = d.new.filter((a) => !d.old.includes(a));
        nodesWithSamePackage.forEach((n) => {
          toRemove.forEach((r) => {
            const edgesToRemove = [...canvasStore.canvasEdges.keys()].filter(
              (e) =>
                i == 0
                  ? e.endsWith(n + '-{in}-' + r)
                  : e.startsWith(n + '-{out}-' + r)
            );
            edgesToRemove.forEach((e) => canvasStore.canvasEdges.delete(e));
          });
        });
        toRemove.forEach((r) => {
          i == 0 ? delete structure.input[r] : delete structure.output[r];
        });
        toAdd.forEach((a) => {
          i == 0
            ? (structure.input[a] = 'custom')
            : (structure.output[a] = 'custom');
        });
      });

      nodePackage = res.package;
    }
  });
};

const getNextCustomNodeStructureId = () => {
  let nodeStructureId = '';
  for (let i = 1; true; i++) {
    nodeStructureId = `rain.nodes.custom.custom.CustomNode${i}`;
    if (configStore.getNodeStructureByNodePackage(nodeStructureId) == null) {
      break;
    }
  }

  return nodeStructureId;
};
</script>
