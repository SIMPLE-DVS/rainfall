<template>
  <q-item-label header class="row justify-center">Custom Nodes</q-item-label>

  <q-list bordered separator>
    <div v-if="customNodes.length == 0">No custom nodes defined so far...</div>
    <q-item
      v-for="node in customNodes"
      :key="node"
      :draggable="true"
      @dragstart="$event.dataTransfer.setData('text', node.package)"
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
