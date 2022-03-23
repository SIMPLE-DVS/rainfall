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
      <p>{{ $t('export.setting') }}</p>
      <q-input
        v-model="startIP"
        :label="$t('export.startingIP')"
        mask="###.###.###.###"
        fill-mask="0"
        :rules="[(val) => isIPValid(startIP), validateIPRange(startIP, endIP)]"
      ></q-input>
      <q-input
        v-model="endIP"
        :label="$t('export.endingIP')"
        mask="###.###.###.###"
        fill-mask="0"
        :rules="[(val) => isIPValid(endIP), validateIPRange(startIP, endIP)]"
      ></q-input>
      <q-btn
        color="primary"
        :label="$t('export.check')"
        @click="checkDevices(startIP, endIP)"
        :disabled="!validateIPRange(startIP, endIP)"
      ></q-btn>
    </div>

    <div class="q-pa-sm q-gutter-sm" v-if="devices.length > 0">
      <q-expansion-item class="q-pa-sm q-gutter-y-sm">
        <template v-slot:header>
          <q-item-section>{{
            $t('export.range', { from: actualStart, to: actualEnd })
          }}</q-item-section>
          <q-item-section side>{{
            selected.length + $t('export.selected')
          }}</q-item-section>
        </template>
        <q-list class="row justify-content" style="max-width: 100%">
          <q-item
            v-for="n in Math.min(
              devicesPerPage,
              devices.length - (current - 1) * devicesPerPage
            )"
            :key="n"
          >
            <q-item-section class="row justify-center items-center">
              <q-item>
                <q-item-section avatar>
                  <q-avatar icon="computer"></q-avatar>
                </q-item-section>
                <q-checkbox
                  v-model="selected"
                  :val="
                    ipToNumber(actualStart) +
                    ((current - 1) * devicesPerPage + n - 1)
                  "
                ></q-checkbox>
              </q-item>
              <q-item-label class="q-pb-sm">{{
                numberToIP(
                  ipToNumber(actualStart) +
                    ((current - 1) * devicesPerPage + n - 1)
                )
              }}</q-item-label>
              <q-chip v-if="Math.random() < 0.5">
                <q-avatar icon="circle" class="text-green"></q-avatar>
                <q-item-label caption>{{
                  $t('export.available')
                }}</q-item-label>
              </q-chip>
              <q-chip v-else>
                <q-avatar icon="circle" class="text-red"></q-avatar>
                <q-item-label caption>{{ $t('export.busy') }}</q-item-label>
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>

        <q-pagination
          class="q-pa-sm justify-center"
          v-model="current"
          :max="
            devices.length % devicesPerPage == 0
              ? devices.length / devicesPerPage
              : Math.floor(devices.length / devicesPerPage) + 1
          "
          :max-pages="6"
          boundary-numbers
        />
        <div class="row justify-center">
          {{
            $t('export.pagination', {
              from: (current - 1) * devicesPerPage + 1,
              to: Math.min(
                devices.length,
                (current - 1) * devicesPerPage + devicesPerPage
              ),
              total: devices.length,
            })
          }}
        </div>
      </q-expansion-item>
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
    let startIP = ref('255.255.255.255');
    let endIP = ref('255.255.255.255');
    let devices = ref([]);
    let isRangeValid = ref(true);
    let current = ref(1);
    const devicesPerPage = 32;
    let actualStart = ref('');
    let actualEnd = ref('');
    let selected = ref([]);

    const ipRegEx = new RegExp(
      '((00[0-9]|0[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(00[0-9]|0[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])'
    );

    const isIPValid = (ip: string) => {
      return ipRegEx.test(ip);
    };

    const ipToNumber = (ip: string) => {
      return ip
        .split('.')
        .map((p) => parseInt(p))
        .reverse()
        .reduce((acc, val, i) => acc + val * 256 ** i, 0);
    };

    const numberToIP = (n: number) => {
      var part1 = (n & 255).toString().padStart(3, '0');
      var part2 = ((n >> 8) & 255).toString().padStart(3, '0');
      var part3 = ((n >> 16) & 255).toString().padStart(3, '0');
      var part4 = ((n >> 24) & 255).toString().padStart(3, '0');

      return `${part4}.${part3}.${part2}.${part1}`;
    };

    const validateIPRange = (start: string, end: string) => {
      if (!isIPValid(start) || !isIPValid(end)) return false;
      if (ipToNumber(start) > ipToNumber(end)) return false;
      return true;
    };

    const checkDevices = (start: string, end: string) => {
      let fromNum = ipToNumber(start);
      let toNum = ipToNumber(end);
      if (devices.value.length != toNum - fromNum + 1) {
        current.value = 1;
      }
      if (
        fromNum != ipToNumber(actualStart.value) ||
        toNum != ipToNumber(actualEnd.value)
      ) {
        selected.value = [];
        devices.value = [];
        for (let i = fromNum; i <= toNum; i++) {
          devices.value.push(i);
        }
        actualStart.value = start;
        actualEnd.value = end;
      }
    };

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
      startIP,
      endIP,
      isIPValid,
      isRangeValid,
      validateIPRange,
      checkDevices,
      devices,
      ipToNumber,
      numberToIP,
      current,
      devicesPerPage,
      actualStart,
      actualEnd,
      selected,
      getZip,
      filePicker,
      file,
      loadUI,
      saveUI,
    };
  },
};
</script>
