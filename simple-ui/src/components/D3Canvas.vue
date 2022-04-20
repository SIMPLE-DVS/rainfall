<template>
  <div class="full-space">
    <svg
      class="d3-svg full-space"
      @dragover="allowDrop($event)"
      @drop="drop($event)"
    >
      <g data-type="graphics">
        <rect class="sel-rect" rx="10" ry="10"></rect>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch } from 'vue';
import * as d3 from 'd3';
import {
  clearSelection,
  createNode,
  DataType,
  extractTranslateCoords,
  handleGroupDrag,
  selectNode,
} from 'components/d3models';
import CustomNodeDialog from 'components/customNode/CustomNodeDialog.vue';
import { useConfigStore } from 'src/stores/configStore';
import {
  CustomNodeInfo,
  CustomNodeStructure,
  NodeInfo,
  SimpleNodeParameter,
} from './models';
import { useCustomStore } from 'src/stores/customStore';
import { useQuasar, event } from 'quasar';
import { useCanvasStore } from 'src/stores/canvasStore';

export default defineComponent({
  name: 'D3Canvas',

  setup() {
    const $q = useQuasar();
    const configStore = useConfigStore();
    const customStore = useCustomStore();
    const canvasStore = useCanvasStore();

    let d3elem: Element = null;
    let d3svg: d3.Selection<Element, unknown, null, undefined> = null;
    let d3g: d3.Selection<Element, unknown, null, undefined> = null;
    let d3selRect: d3.Selection<SVGRectElement, unknown, null, undefined> =
      null;
    // let rightDrag: GenericCoords = null;

    onMounted(() => {
      d3elem = document.getElementsByClassName('d3-svg')[0];
      d3svg = d3.select(d3elem);
      d3g = d3svg.selectChild('g[data-type=graphics]');
      d3selRect = d3g.selectChild<SVGRectElement>('.sel-rect');

      function handleZoom(
        this: Element,
        e: d3.D3ZoomEvent<d3.ZoomedElementBaseType, unknown>
      ) {
        if (this == d3elem) {
          d3g.attr('transform', e.transform.toString());
        }
      }

      // TODO: select multiple nodes with right mouse button
      /*function handleDragStart(
        this: Element,
        e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
      ) {
        console.log('start');
        if (event.rightClick(e.sourceEvent)) {
          const transform = d3.zoomTransform(d3elem);
          const x = transform.invertX(e.sourceEvent.offsetX);
          const y = transform.invertX(e.sourceEvent.offsetY);
          d3svg
            .insert('rect')
            .attr('data-type', 'selection')
            .attr('x', x)
            .attr('y', y)
            .attr('width', 0)
            .attr('height', 0)
            .attr('fill', '#1976d2')
            .attr('opacity', 0.5);
          rightDrag = { x: x, y: y };
        }
      }

      function handleDrag(
        this: Element,
        e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
      ) {
        console.log('drag');
        if (rightDrag != null) {
          event.stopAndPrevent(e.sourceEvent);
          const transform = d3.zoomTransform(d3elem);
          const x = transform.invertX(e.sourceEvent.offsetX);
          const y = transform.invertY(e.sourceEvent.offsetY);
          const selectionRect = d3.select('rect[data-type=selection]');
          selectionRect
            .attr('x', rightDrag.x < x ? rightDrag.x : x)
            .attr('y', rightDrag.y < y ? rightDrag.y : y)
            .attr('width', Math.abs(x - rightDrag.x))
            .attr('height', Math.abs(y - rightDrag.y));
        }
      }

      function handleDragEnd(
        this: Element,
        e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
      ) {
        console.log('end');
        if (event.rightClick(e.sourceEvent)) {
          rightDrag = null;
          d3.selectAll('rect[data-type=selection]').remove();
        }
        // TODO: intersect selection rectangles and groups,
        // update canvasStore.selectedNodes
      }

      d3sel.call(
        d3
          .drag()
          .on('start', handleDragStart)
          .on('drag', handleDrag)
          .on('end', handleDragEnd) as never
      );*/

      d3svg
        .call(
          d3
            .zoom()
            .scaleExtent([0.2, 5])
            .filter(function (this: Element, e: Event) {
              if (e.type == 'wheel') {
                return !(e as WheelEvent).ctrlKey;
              }

              if (event.rightClick(e as MouseEvent)) {
                return false;
              }

              return true;
            })
            .on('zoom', handleZoom)
        )
        .on('click', (e: PointerEvent) => {
          if (event.rightClick(e)) {
            return false;
          }
          if (e.target == d3elem) {
            clearSelection(d3g);
          }
        })
        .on('dblclick.zoom', null)
        .on('contextmenu', (e: PointerEvent) => {
          event.prevent(e);
        });

      watch(
        () => customStore.nodeToEdit,
        (newVal) => {
          if (newVal != null) {
            openCustomNodeDialog(newVal);
          }
        }
      );

      watch(
        () => canvasStore.selectedNodes,
        (newVal) => {
          d3selRect.attr('width', 0).attr('height', 0);
          if (newVal.length == 0) {
            return;
          }

          let left: number = null;
          let top: number = null;
          let right: number = null;
          let bottom: number = null;
          newVal.forEach((v) => {
            const coords = extractTranslateCoords(
              d3g.select('g[data-id=' + v.name + ']').attr('transform')
            );
            const box = (
              d3g.select('g[data-id=' + v.name + ']').node() as SVGGElement
            ).getBBox();
            if (left == null || coords.x + box.x < left) {
              left = coords.x + box.x;
            }
            if (top == null || coords.y + box.y < top) {
              top = coords.y + box.y;
            }
            if (right == null || coords.x + box.x + box.width > right) {
              right = coords.x + box.x + box.width;
            }
            if (bottom == null || coords.y + box.y + box.height > bottom) {
              bottom = coords.y + box.y + box.height;
            }
          });

          const selectedNodes = d3g
            .selectAll<SVGGElement, DataType>('g')
            .filter((d) => d.selected);

          d3selRect
            .attr('x', left - 5)
            .attr('y', top - 5)
            .attr('width', right - left + 10)
            .attr('height', bottom - top + 10)
            .call(
              d3
                .drag()
                .on(
                  'drag',
                  function (
                    this,
                    e: d3.D3DragEvent<
                      d3.DraggedElementBaseType,
                      unknown,
                      unknown
                    >
                  ) {
                    d3.select(this)
                      .attr('x', +d3.select(this).attr('x') + e.dx)
                      .attr('y', +d3.select(this).attr('y') + e.dy);
                    selectedNodes.each((_, i, a) => {
                      d3.select(a[i]).call(() => {
                        handleGroupDrag.call(a[i], e, d3elem);
                      });
                    });
                  }
                ) as never
            );
        },
        { deep: true }
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
      clearSelection(d3g);
      if (clazz === 'rain.nodes.custom.custom.CustomNode') {
        openCustomNodeDialog();
      } else {
        if (!configStore.nodeStructures.has(clazz)) {
          return;
        }
        const nodeStructure = configStore.getNodeStructureByNodePackage(clazz);
        const id = createNodeId(nodeStructure.clazz);
        const transform = d3.zoomTransform(d3elem);
        const addedNode = createNode(d3elem, d3g, d3selRect, {
          name: id,
          package: clazz,
          x: transform.invertX(x),
          y: transform.invertY(y),
          selected: false,
        });
        configStore.setNodeConfig(clazz, id);
        selectNode(addedNode.node(), d3g, false);
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

.sel-rect {
  fill: #1976d2;
  fill-opacity: 0.25;
  stroke: #1976d2;
  stroke-width: 3px;
  stroke-dasharray: 10, 10;
  stroke-linejoin: round;
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
