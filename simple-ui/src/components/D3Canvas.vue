<template>
  <div class="full-space">
    <svg
      class="d3-svg full-space"
      @dragover="allowDrop($event)"
      @drop="drop($event)"
    >
      <g></g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch } from 'vue';
import * as d3 from 'd3';
import { clearSelection, createNode, selectNode } from 'components/d3models';
import CustomNodeDialog from 'components/customNode/CustomNodeDialog.vue';
import { useConfigStore } from 'src/stores/configStore';
import {
  CustomNodeInfo,
  CustomNodeStructure,
  NodeInfo,
  SimpleNodeParameter,
} from './models';
import { useCustomStore } from 'src/stores/customStore';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'D3Canvas',

  setup() {
    const $q = useQuasar();
    const configStore = useConfigStore();
    const customStore = useCustomStore();

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

      watch(
        () => customStore.nodeToEdit,
        (newVal) => {
          if (newVal != null) {
            openCustomNodeDialog(newVal);
          }
        }
      );
    });

    const openCustomNodeDialog = (nodeInfo?: NodeInfo) => {
      $q.dialog({
        component: CustomNodeDialog,

        componentProps: {
          node: nodeInfo,
        },
      }).onOk((res: CustomNodeInfo) => {
        addCustomCanvasNode(res);
      });
    };

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

    const getNextCustomNodeStructureId = () => {
      let nodeStructureId = '';
      for (let i = 1; true; i++) {
        nodeStructureId = `${'rain.nodes.custom.custom.CustomNode'}${i}`;
        if (
          configStore.getNodeStructureByNodePackage(nodeStructureId) == null
        ) {
          break;
        }
      }

      return nodeStructureId;
    };

    const allowDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    const drop = (e: DragEvent) => {
      e.preventDefault();
      const clazz = e.dataTransfer.getData('text');
      dropNode(e.offsetX, e.offsetY, clazz);
    };

    const dropNode = (x: number, y: number, clazz: string) => {
      if (clazz === 'rain.nodes.custom.custom.CustomNode') {
        openCustomNodeDialog();
      } else {
        if (!configStore.nodeStructures.has(clazz)) {
          return;
        }
        const nodeStructure = configStore.getNodeStructureByNodePackage(clazz);
        const id = createNodeId(nodeStructure.clazz);
        const transform = d3.zoomTransform(d3elem);
        const addedNode = createNode(d3elem, d3g, {
          name: id,
          package: clazz,
          x: transform.invertX(x),
          y: transform.invertY(y),
        });
        configStore.setNodeConfig(clazz, id);
        selectNode(addedNode.node());
      }
    };

    const addCustomCanvasNode = (customNodeInfo: CustomNodeInfo) => {
      // TODO: when editing, save oldStructure and confront it with the new one
      // to decide what needs to be changed/removed (edges, parameters, etc...)
      /*const oldStructure = configStore.getNodeStructureByNodePackage(
        customNodeInfo.package
      );*/
      const nodeStructureId = customNodeInfo.editMode
        ? customStore.nodeToEdit.package
        : getNextCustomNodeStructureId();
      const inputs = customNodeInfo.inputs.reduce(
        (acc, value) => Object.assign(acc, { [value]: 'custom' }),
        {}
      );
      const outputs = customNodeInfo.outputs.reduce(
        (acc, value) => Object.assign(acc, { [value]: 'custom' }),
        {}
      );
      const parameters = customNodeInfo.parameters.map((p) => {
        return {
          name: p,
          type: 'Any',
          is_mandatory: false,
          description: 'Custom Parameter: ' + p,
          default_value: null,
        } as SimpleNodeParameter;
      });
      const nodeStructure: CustomNodeStructure = {
        package: nodeStructureId,
        clazz: customNodeInfo.clazz,
        input: inputs,
        output: outputs,
        parameter: parameters,
        methods: null as string[],
        tags: {
          library: 'Base',
          type: 'Custom',
        },
        name: customNodeInfo.name,
        description: 'A Custom Node.',
        function_name: customNodeInfo.function,
        code: customNodeInfo.code,
      };

      if (!customNodeInfo.editMode) {
        configStore.addNodeStructure(nodeStructure);
        dropNode(
          (d3svg.node() as SVGSVGElement).width.baseVal.value / 2,
          (d3svg.node() as SVGSVGElement).height.baseVal.value / 2,
          nodeStructure.package
        );
      } else {
        // TODO: manage editing existing nodes
        console.log(
          d3.select('g[data-package="' + customNodeInfo.package + '"]').size()
        );
        configStore.addNodeStructure(nodeStructure);
      }
    };

    return {
      allowDrop,
      drop,
      addCustomCanvasNode,
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
  outline: 3px solid red;
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
