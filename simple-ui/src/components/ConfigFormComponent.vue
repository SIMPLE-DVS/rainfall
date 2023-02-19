<!--
 Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
 Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 -->

<template>
  <q-scroll-area
    style="width: 100%; height: 100%; position: absolute"
    :key="node.name"
  >
    <div class="q-pa-sm row justify-center">
      <q-chip outline size="lg" text-color="primary">
        {{ node.name }}
      </q-chip>
    </div>

    <div class="q-px-md">
      {{ nodeDescription }}
    </div>

    <q-separator color="primary" inset spaced />

    <div v-if="node.package.includes('rain.nodes.custom.custom.CustomNode')">
      <div class="row justify-center">
        <q-btn
          label="Edit"
          color="primary"
          icon="edit"
          @click="editCustomNode(node.package)"
          data-cy="editCustomNode"
        ></q-btn>
      </div>

      <q-separator color="primary" inset spaced />
    </div>

    <q-list dense>
      <q-item-label header class="row justify-center"
        >Node Configuration</q-item-label
      >
      <q-item
        class="q-pa-sm column"
        v-for="(v, k) in nodeConfigStructure"
        :key="k"
      >
        <q-item-section>
          <q-item-label
            ><b>{{ k }}:</b> <i>{{ v.type }}</i></q-item-label
          >
          <q-item-label caption>{{ v.description }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="v.is_mandatory">
          <q-badge color="negative">Required</q-badge>
        </q-item-section>
        <component
          class="q-py-xs q-pb-md"
          :is="nodeConfigComponents.get(k as string)"
          v-model="nodeConfigData[k]"
          :param="v"
          :nodeName="node.name"
        >
        </component>
      </q-item>
    </q-list>

    <q-separator color="primary" inset spaced />

    <div class="q-pb-sm row justify-center">
      <q-btn
        label="Reset to default"
        color="primary"
        @click="
          configStore.setNodeConfig(node.package, node.name);
          $emit('resetNode');
        "
      ></q-btn>
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { markRaw, ref, Ref, watch } from 'vue';
import { useConfigStore } from 'stores/configStore';
import { ComponentTypeRegexes, NodeInfo, SimpleNodeParameter } from './models';
import { useRouter } from 'vue-router';
import { QInput } from 'quasar';

const props = defineProps<{
  node: NodeInfo;
}>();

const router = useRouter();
const configStore = useConfigStore();
const nodeDescription: Ref<string> = ref('');
const nodeConfigStructure: Ref<{ [index: string]: SimpleNodeParameter }> = ref(
  {}
);
const nodeConfigComponents: Ref<Map<string, unknown>> = ref();
const nodeConfigData: Ref<{ [index: string]: unknown }> = ref({});

const updateNode = (node: NodeInfo) => {
  const nodeStructure = configStore.getNodeStructureByNodePackage(node.package);
  nodeDescription.value = nodeStructure.description;
  nodeConfigStructure.value = nodeStructure.parameter.reduce(
    (acc, value) => Object.assign(acc, { [value.name]: value }),
    {}
  );
  nodeConfigComponents.value = new Map<string, unknown>(
    Object.entries(nodeConfigStructure.value).map((v) => [
      v[0],
      getConfigComponent((v[1] as SimpleNodeParameter).type),
    ])
  );
  nodeConfigData.value = configStore.nodeConfigs.get(node.name);
};

const getConfigComponent = (type: string) => {
  let component = null;
  for (const [k, v] of ComponentTypeRegexes) {
    if (v.test(type)) {
      component = k + 'ConfigComponent';
      break;
    }
  }
  return component == null ? markRaw(QInput) : component;
};

const editCustomNode = (nodePackage: string) => {
  void router.push({
    name: 'editor',
    params: { nodePackage },
  });
};

watch(
  () => props.node,
  (newVal) => {
    (document.activeElement as HTMLElement)?.blur();
    updateNode(newVal);
  },
  { immediate: true }
);
</script>
