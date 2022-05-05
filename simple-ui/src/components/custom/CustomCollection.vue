<template>
  <q-item-label header class="row justify-center">Custom Nodes</q-item-label>
  <div class="row justify-center">
    <q-btn outline label="New Custom Node" color="primary"></q-btn>
  </div>

  <q-list class="row justify-center" bordered separator>
    <q-item
      v-for="node in customNodes"
      :key="node"
      :draggable="true"
      @dragstart="$event.dataTransfer.setData('text', node.package)"
    >
      <q-item-section avatar>
        <q-icon name="share" color="orange" size="34px" />
      </q-item-section>
      <q-item-section>{{ node.clazz }}</q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { defineComponent, watch, ref, onMounted } from 'vue';
import { useConfigStore } from 'stores/configStore';

export default defineComponent({
  name: 'CustomCollection',

  setup() {
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

    return {
      customNodes,
    };
  },
});
</script>
