<template>
  <div class="full-space">
    <svg
      class="d3-svg full-space"
      @dragover="allowDrop($event)"
      @drop="drop($event)"
    >
      <g></g>
    </svg>

    <custom-node-dialog
      v-model="showCustomNodeDialog"
      @onCreateCustomNode="
        showCustomNodeDialog = false;
        addCustomCanvasNode();
      "
    ></custom-node-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import * as d3 from 'd3';
import { clearSelection, createNode, selectNode } from 'components/d3models';
import CustomNodeDialog from 'components/customNode/CustomNodeDialog.vue';
import { useConfigStore } from 'src/stores/configStore';
import { SimpleNodeStructure } from './models';

export default defineComponent({
  name: 'D3Canvas',

  components: { CustomNodeDialog },

  setup() {
    const showCustomNodeDialog = ref(false);
    const configStore = useConfigStore();

    let d3elem: Element = null;
    let d3svg: d3.Selection<Element, unknown, null, undefined> = null;
    let d3g: d3.Selection<d3.BaseType, unknown, null, undefined> = null;

    onMounted(() => {
      d3elem = document.getElementsByClassName('d3-svg')[0];
      d3svg = d3.select(d3elem);
      d3g = d3svg.selectChild('g');

      function handleZoom(
        this: Element,
        e: d3.D3ZoomEvent<d3.ZoomedElementBaseType, unknown>
      ) {
        if (this == d3elem) {
          d3g.attr('transform', e.transform.toString());
        }
      }

      d3svg
        .call(d3.zoom().scaleExtent([0.2, 5]).on('zoom', handleZoom) as never)
        .on('click', (e: Event) => {
          if (e.target == d3elem) {
            clearSelection();
          }
        })
        .on('dblclick.zoom', null);
    });

    const createNodeId = (nodeClass: string) => {
      let nodeId = '';
      for (let i = 1; true; i++) {
        nodeId = `${nodeClass}${i}`;
        if (d3.select('g[data-id=' + nodeId + ']').empty()) {
          break;
        }
      }

      return nodeId;
    };

    const allowDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    const drop = (e: DragEvent) => {
      e.preventDefault();
      const clazz = e.dataTransfer.getData('text');
      if (clazz === 'rain.nodes.custom.custom.CustomNode') {
        showCustomNodeDialog.value = true;
      } else {
        if (!configStore.nodeStructures.has(clazz)) {
          return;
        }
        const nodeStructure: SimpleNodeStructure =
          configStore.getNodeStructureByNodePackage(clazz);
        const inputs = new Map<string, string>(
          Object.entries(nodeStructure.input)
        );
        const outputs = new Map<string, string>(
          Object.entries(nodeStructure.output)
        );
        const id = createNodeId(nodeStructure.clazz);
        const transform = d3.zoomTransform(d3elem);
        const addedNode = createNode(d3elem, d3g, {
          name: id,
          package: clazz,
          x: transform.invertX(e.offsetX),
          y: transform.invertY(e.offsetY),
          inputs: inputs,
          outputs: outputs,
        });
        configStore.setNodeConfig(clazz, id);
        selectNode(addedNode.node());
      }
    };

    return {
      showCustomNodeDialog,
      allowDrop,
      drop,
    };
  },
});
</script>

<style scoped>
.full-space {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  border: 0;
}

svg :deep(.selected) {
  outline: 3px red;
  outline-offset: 3px;
  outline-style: dashed;
}

svg :deep(.hovered) {
  outline: 3px solid rgba(25, 103, 210, 0.5);
  outline-offset: 3px;
  outline-style: dashed;
}

svg :deep(.compatible) {
  fill: #e7ff53;
}

svg :deep(.connected) {
  fill: #5dff77;
}
</style>
