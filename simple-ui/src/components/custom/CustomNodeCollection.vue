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
  <q-item-label header class="row justify-center">Custom Nodes</q-item-label>

  <q-list bordered separator>
    <div v-if="customNodes.length == 0">No custom nodes defined so far...</div>
    <q-item
      v-for="node in customNodes"
      :key="node"
      :draggable="true"
      @dragstart="$event.dataTransfer.setData('text', node.package)"
      data-cy="customNode"
    >
      <q-item-section avatar>
        <q-icon name="share" color="orange" />
      </q-item-section>
      <q-item-section>{{ node.clazz }}</q-item-section>
      <q-btn
        dense
        outline
        icon="delete"
        @click="onDeleteCustomNode(node.package)"
        data-cy="deleteCustomNode"
      />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useConfigStore } from 'stores/configStore';
import { useCanvasStore } from 'src/stores/canvasStore';
import { PathElements } from '../d3/types';

const configStore = useConfigStore();
const customNodes = ref([]);

onMounted(() => {
  watch(
    () => configStore.nodeStructures,
    (newVal) => {
      customNodes.value = [...newVal.values()]
        .filter((n) => {
          return (
            n.package != 'rain.nodes.custom.custom.CustomNode' &&
            n.package.includes('rain.nodes.custom.custom.CustomNode')
          );
        })
        .map((n) => {
          return { clazz: n.clazz, package: n.package };
        });
    },
    { deep: true, immediate: true }
  );
});

const onDeleteCustomNode = (nodePackage: string) => {
  const canvasStore = useCanvasStore();
  const customNodesWithSamePackage = [...canvasStore.canvasNodes.values()]
    .filter((n) => n.package == nodePackage)
    .map((n) => n.name);
  customNodesWithSamePackage.forEach((n) => {
    canvasStore.canvasEdges = new Map<string, PathElements>(
      [...canvasStore.canvasEdges.entries()].filter(([, e]) => {
        return n != e.fromNode && n != e.toNode;
      })
    );
    canvasStore.canvasNodes.delete(n);
    configStore.removeNodeConfig(n);
  });
  configStore.nodeStructures.delete(nodePackage);
  customNodes.value.splice(
    customNodes.value.findIndex((v) => v == nodePackage, 1)
  );
};
</script>
