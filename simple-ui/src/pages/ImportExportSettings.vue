<template>
  <q-page padding>
    <div class="q-pa-md q-gutter-sm">
      <p>UI File</p>

      <q-file
        ref="filePicker"
        class="fit-content"
        style="display: none"
        accept=".json"
        v-model="file"
        @update:model-value="loadUI()"
      ></q-file>
      <q-btn
        color="secondary"
        icon="upload"
        label="Load"
        @click="filePicker.pickFiles()"
      ></q-btn>
      <q-btn color="secondary" icon="download" label="Save" @click="saveUI()">
      </q-btn>
    </div>

    <q-separator spaced=""></q-separator>

    <div class="q-pa-md q-gutter-sm">
      <p>Zip File</p>

      <q-btn color="secondary" label="Download ZIP" @click="getZip()"></q-btn>
    </div>

    <q-separator spaced=""></q-separator>

    <div class="q-pa-md q-gutter-sm">
      <p>REPOSITORIES</p>
    </div>
  </q-page>
</template>

<script lang="ts">
import { ref, Ref } from 'vue';
import { useCanvasStore } from 'stores/canvasStore';
import { useConfigStore } from 'stores/configStore';
import { api } from '../boot/axios';
import { FabricEdge } from 'components/fabricModels';
import { exportFile, QFile } from 'quasar';
import {
  AnyParameterConfig,
  CustomNodeStructure,
  SimpleNodeStructure,
} from 'src/components/models';

export default {
  name: 'PageImportExport',

  setup() {
    const filePicker: Ref<QFile> = ref(null);
    const file: Ref<File> = ref(null);

    const downloadZip = async () => {
      const canvasStore = useCanvasStore();
      const configStore = useConfigStore();

      const config: { [index: string]: unknown } = {};
      config['pipeline_uid'] = Math.floor(100000 * Math.random()).toString();

      config['nodes'] = [...canvasStore.canvasNodes.keys()].map(
        (nodeName: string) => {
          const nodePackage = canvasStore.canvasNodes.get(nodeName).nodePackage;
          const nodeConfig: { [index: string]: unknown } = {
            node_id: nodeName,
            node: nodePackage.includes('rain.nodes.custom.custom.CustomNode')
              ? 'rain.nodes.custom.custom.CustomNode'
              : nodePackage,
            parameters: Object.entries(
              configStore.nodeConfigs.get(nodeName)
            ).reduce(
              (acc, value) =>
                value[1] != null
                  ? Object.assign(acc, { [value[0]]: value[1] })
                  : acc,
              {}
            ),
          };

          if (
            (nodeConfig.node as string).includes(
              'rain.nodes.custom.custom.CustomNode'
            )
          ) {
            nodeConfig['function_name'] = (
              configStore.nodeStructures.get(nodePackage) as CustomNodeStructure
            ).function_name;
            nodeConfig['code'] = (
              configStore.nodeStructures.get(nodePackage) as CustomNodeStructure
            ).code;
          }

          nodeConfig['then'] = canvasStore.canvasNodes
            .get(nodeName)
            .outputPorts.filter((op) => op.edges.length > 0)
            .reduce((acc, val) => acc.concat(val.edges), [] as FabricEdge[])
            .map((edge) => {
              const edgeConfig: { [index: string]: unknown } = {
                send_to: edge.to.group.name,
              };

              const fromParamName = edge.from.paramName;
              const toParamName = edge.to.paramName;
              edgeConfig[fromParamName] = toParamName;

              return edgeConfig;
            });

          return nodeConfig;
        }
      );

      config['dependencies'] = [...canvasStore.canvasNodes.keys()]
        .map((nodeName) => canvasStore.canvasNodes.get(nodeName).nodePackage)
        .map((nodePackage) =>
          configStore.nodeStructures
            .get(nodePackage)
            .tags['library'].toLowerCase()
        )
        .reduce(
          (acc, value) =>
            value != 'custom' && acc.indexOf(value) == -1
              ? acc.concat(value)
              : acc,
          [] as string[]
        );

      config['ui'] = getUI();

      console.log(JSON.stringify(config));

      return await api.post('/config', config, { responseType: 'blob' });
    };

    const getZip = () => {
      downloadZip()
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'prova.zip');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch((error) => {
          alert(error);
        });
    };

    const loadUI = () => {
      const canvasStore = useCanvasStore();

      const fileValue = file.value;
      const reader = new FileReader();
      if (fileValue.name.includes('.json')) {
        reader.onload = (res) => {
          canvasStore.uiFile = JSON.parse(res.target.result as string);
        };
        reader.onerror = (err) => {
          console.log('ERROR DURING LOAD');
          console.log(err);
        };
        reader.readAsText(fileValue, 'utf8');
      }
    };

    const getUI = () => {
      const canvasStore = useCanvasStore();
      const configStore = useConfigStore();

      const nodes = [...canvasStore.canvasNodes.values()].map((v) =>
        v.toJSONObject()
      );

      const customNodes = [] as [];

      const edges: string[] = [...canvasStore.canvasEdges.keys()];

      const structures: { [index: string]: SimpleNodeStructure } = {};
      configStore.nodeStructures.forEach((v, k) => {
        structures[k] = v;
      });

      const configs: { [index: string]: unknown } = {};
      configStore.nodeConfigs.forEach((v, k) => {
        configs[k] = v;
      });

      const anyConfigs: { [index: string]: AnyParameterConfig } = {};
      configStore.nodeAnyConfigs.forEach((v, k) => {
        anyConfigs[k] = v;
      });

      const uiState = {
        nodes: nodes,
        customNodes: customNodes,
        edges: edges,
        canvasTransform: canvasStore.canvasTransform,
        structures: structures,
        configs: configs,
        anyConfigs: anyConfigs,
      };

      return uiState;
    };

    const saveUI = () => {
      const uiState = getUI();

      const status = exportFile('ui.json', JSON.stringify(uiState), {
        mimeType: 'application/json',
        encoding: 'utf-8',
      });

      if (status) {
        console.log('SAVED');
      } else {
        console.log('ERROR DURING SAVE');
        console.log((status as Error).message);
      }
    };

    return {
      filePicker,
      file,
      getZip,
      loadUI,
      saveUI,
    };
  },
};
</script>
