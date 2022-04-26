<template>
  <div class="full-space">
    <svg
      class="d3-svg full-space"
      @dragover="allowDrop($event)"
      @drop="drop($event)"
    >
      <g class="graphics">
        <g class="selection">
          <rect class="sel-rect" rx="10" ry="10"></rect>
        </g>
        <g class="commands"></g>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch } from 'vue';
import * as d3 from 'd3';
import {
  clearSelection,
  copyGroups,
  createCommands,
  createNode,
  deleteGroup,
  selectNode,
} from 'src/components/d3/models';
import CustomNodeDialog from 'components/customNode/CustomNodeDialog.vue';
import { useConfigStore } from 'src/stores/configStore';
import {
  CustomNodeInfo,
  CustomNodeStructure,
  NodeInfo,
  SimpleNodeParameter,
} from '../models';
import { useCustomStore } from 'src/stores/customStore';
import { useQuasar, event } from 'quasar';
import { useCanvasStore } from 'src/stores/canvasStore';
import { D3_CONSTS, DataType, GenericCoords } from './types';
import { extractTranslateCoords, getNextNodeId } from './utils';

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
    let d3sel: d3.Selection<SVGGElement, unknown, null, undefined> = null;
    let d3com: d3.Selection<SVGGElement, unknown, null, undefined> = null;
    let rightDrag: GenericCoords = null;

    onMounted(() => {
      d3elem = document.getElementsByClassName('d3-svg')[0];
      d3svg = d3.select(d3elem);
      d3g = d3svg.selectChild('.graphics');
      d3sel = d3g.selectChild<SVGGElement>('.selection');
      d3com = d3g.selectChild('.commands');
      d3com.attr('visibility', 'hidden');
      createCommands(d3com);
      d3com.selectAll<SVGGElement, unknown>('.command.copy').on('click', () => {
        $q.dialog({
          message: 'Are you sure you want to copy the node(s)?',
          cancel: true,
        }).onOk(() => {
          const names = canvasStore.selectedNodes.map((n) => n.name);
          const groups = d3g
            .selectAll<SVGGElement, unknown>('.node')
            .filter(function (this) {
              return names.includes(this.dataset['id']);
            });
          copyGroups(d3g, d3sel, groups);
        });
      });
      d3com.selectAll<SVGGElement, unknown>('.command.edit').on('click', () => {
        console.log('EDIT');
      });
      d3com
        .selectAll<SVGGElement, unknown>('.command.delete')
        .on('click', () => {
          $q.dialog({
            message: 'Are you sure you want to delete the node(s)?',
            cancel: true,
          }).onOk(() => {
            canvasStore.selectedNodes.forEach((n) =>
              deleteGroup(d3g, d3g.select('.node[data-id=' + n.name + ']'))
            );
            canvasStore.selectedNodes = [];
          });
        });

      function handleZoom(
        this: Element,
        e: d3.D3ZoomEvent<d3.ZoomedElementBaseType, unknown>
      ) {
        if (this == d3elem) {
          d3g.attr('transform', e.transform.toString());
        }
      }

      function handleDragStart(
        this: Element,
        e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
      ) {
        const x = e.sourceEvent.offsetX;
        const y = e.sourceEvent.offsetY;
        d3svg
          .insert('rect')
          .classed('right-sel-rect', true)
          .attr('x', x)
          .attr('y', y)
          .attr('width', 0)
          .attr('height', 0)
          .attr('fill', '#1976d2')
          .attr('opacity', 0.5);
        rightDrag = { x: x, y: y };
      }

      function handleDrag(
        this: Element,
        e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
      ) {
        if (rightDrag == null) {
          return;
        }
        const x = e.sourceEvent.offsetX;
        const y = e.sourceEvent.offsetY;
        const selectionRect = d3.select('.right-sel-rect');
        selectionRect
          .attr('x', rightDrag.x < x ? rightDrag.x : x)
          .attr('y', rightDrag.y < y ? rightDrag.y : y)
          .attr('width', Math.abs(x - rightDrag.x))
          .attr('height', Math.abs(y - rightDrag.y));
      }

      function handleDragEnd(
        this: Element,
        e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
      ) {
        if (rightDrag == null) {
          return;
        }
        const transform = d3.zoomTransform(d3elem);
        const x = e.sourceEvent.offsetX;
        const y = e.sourceEvent.offsetY;
        const left = transform.invertX(rightDrag.x < x ? rightDrag.x : x);
        const top = transform.invertY(rightDrag.y < y ? rightDrag.y : y);
        const right = transform.invertX(rightDrag.x < x ? x : rightDrag.x);
        const bottom = transform.invertY(rightDrag.y < y ? y : rightDrag.y);
        rightDrag = null;
        d3.selectAll('.right-sel-rect').remove();
        const nodes = d3g.selectChildren<SVGGElement, DataType>('.node');
        nodes.each((d) => {
          d.selected = false;
        });
        canvasStore.selectedNodes = d3g
          .selectChildren<SVGGElement, DataType>('.node')
          .filter(function (this) {
            const coords = extractTranslateCoords(
              this.getAttribute('transform')
            );
            const box = this.getBBox();
            return (
              left <= coords.x + box.width / 2 &&
              coords.x - box.width / 2 <= right &&
              top <= coords.y + box.height / 2 &&
              coords.y - box.height / 2 <= bottom
            );
          })
          .each(function (this, d) {
            d.selected = true;
            d3.select(this).raise();
          })
          .nodes()
          .map((n) => {
            return {
              name: n.getAttribute('data-id'),
              package: n.getAttribute('data-package'),
            } as NodeInfo;
          });
      }

      d3svg.call(
        d3
          .drag()
          .filter((e: Event) => {
            return event.rightClick(e as MouseEvent);
          })
          .on('start', handleDragStart)
          .on('drag', handleDrag)
          .on('end', handleDragEnd) as never
      );

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
          d3sel.attr('visibility', 'hidden');
          d3com.attr('visibility', 'hidden');
          if (newVal.length == 0) {
            return;
          }

          let left: number = null;
          let top: number = null;
          let right: number = null;
          let bottom: number = null;
          newVal.forEach((v) => {
            const group = d3g.selectChild<SVGGElement>(
              '.node[data-id=' + v.name + ']'
            );
            const coords = extractTranslateCoords(group.attr('transform'));
            const box = group.node().getBBox();
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
            .selectChildren<SVGGElement, DataType>('.node')
            .filter((d) => d.selected);
          d3sel
            .select('.sel-rect')
            .attr('width', right - left + D3_CONSTS.SELECTION_OFFSET * 2)
            .attr('height', bottom - top + D3_CONSTS.SELECTION_OFFSET * 2);
          d3com.attr('visibility', null).attr('transform', function (this) {
            return `translate(${
              (left + right) / 2 - this.getBBox().width / 2
            },${top - this.getBBox().height - D3_CONSTS.SELECTION_OFFSET * 2})`;
          });
          d3sel
            .attr(
              'transform',
              `translate(${left - D3_CONSTS.SELECTION_OFFSET},${
                top - D3_CONSTS.SELECTION_OFFSET
              })`
            )
            .attr('visibility', null)
            .call(
              d3
                .drag()
                .on('start', () => {
                  d3com.attr('visibility', 'hidden');
                })
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
                    const coords = extractTranslateCoords(
                      d3sel.attr('transform')
                    );
                    d3com.attr('visibility', 'hidden');
                    d3sel.attr(
                      'transform',
                      `translate(${coords.x + e.dx},${coords.y + e.dy})`
                    );
                    selectedNodes.each((_, i, a) => {
                      d3.select(a[i]).dispatch('move', {
                        bubbles: false,
                        cancelable: false,
                        detail: e,
                      });
                    });
                  }
                )
                .on('end', function (this) {
                  const coords = extractTranslateCoords(
                    d3.select(this).attr('transform')
                  );
                  d3com
                    .attr('visibility', null)
                    .attr('transform', function (this) {
                      return `translate(${
                        coords.x +
                        d3sel.node().getBBox().width / 2 -
                        this.getBBox().width / 2
                      },${coords.y - this.getBBox().height - D3_CONSTS.SELECTION_OFFSET})`;
                    });
                }) as never
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
        const id = getNextNodeId(d3g, nodeStructure.clazz);
        const transform = d3.zoomTransform(d3elem);
        const addedNode = createNode(d3g, d3sel, {
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
          d3
            .select('.node[data-package="' + customNodeInfo.package + '"]')
            .size()
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

:deep(.sel-rect) {
  fill: #1976d2;
  fill-opacity: 0.25;
  stroke: #1976d2;
  stroke-width: 3px;
}

:deep(.command):hover {
  fill-opacity: 0.25;
}

:deep(.hovered) {
  border-radius: 10px;
  outline: 3px solid rgba(25, 103, 210, 0.5);
  outline-offset: 3px;
  outline-style: dashed;
}

:deep(.compatible) {
  fill: #e7ff53;
}

:deep(.connected) {
  fill: #5dff77;
}
</style>
