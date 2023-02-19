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
  <div class="full-space">
    <svg
      class="d3-svg full-space"
      @dragover="allowDrop($event)"
      @drop="drop($event)"
      data-cy="canvas"
    >
      <g class="graphics" data-cy="canvasGraphics">
        <g class="selection">
          <rect class="sel-rect"></rect>
        </g>
        <g class="commands">
          <rect class="sel-rect"></rect>
        </g>
      </g>
    </svg>

    <q-file
      ref="scriptPicker"
      style="display: none"
      accept=".py"
      v-model="script"
      @update:model-value="loadFile(true)"
      data-cy="loadFromScript"
    ></q-file>
    <q-file
      ref="filePicker"
      style="display: none"
      accept=".json"
      v-model="file"
      @update:model-value="loadFile(false)"
      data-cy="loadFromJSON"
    ></q-file>
    <div class="row justify-center q-gutter-md q-pt-md">
      <q-btn
        outline
        icon="file_upload"
        label="LOAD UI"
        @click="filePicker.pickFiles()"
      />
      <q-btn
        outline
        icon="file_download"
        label="SAVE UI"
        @click="saveUI()"
        data-cy="saveUI"
      /><q-btn
        outline
        icon="file_upload"
        label="LOAD FROM SCRIPT"
        @click="scriptPicker.pickFiles()"
      />
      <q-btn
        outline
        icon="file_download"
        label="SAVE SCRIPT"
        @click="saveScript()"
        data-cy="saveScript"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref, watch } from 'vue';
import * as d3 from 'd3';
import {
  clearSelection,
  copyGroups,
  createCommands,
  createEdge,
  createNode,
  deleteGroup,
  renameGroup,
  selectNode,
} from 'src/components/d3/models';
import { useConfigStore } from 'src/stores/configStore';
import { NodeInfo } from '../models';
import { useQuasar, event, QFile } from 'quasar';
import { useCanvasStore } from 'src/stores/canvasStore';
import { D3_CONSTS, DataType, GenericCoords, PathElements } from './types';
import {
  checkPorts,
  extractTranslateCoords,
  getNextNodeId,
  getUIState,
  isNameValid,
  loadUIFromScript,
  loadUIFromFile,
} from './utils';
import { useRouter } from 'vue-router';
import { downloadPythonScript, downloadUI, getNodesConfig } from '../utils';
import { api } from 'src/boot/axios';

const $q = useQuasar();
const router = useRouter();
const configStore = useConfigStore();
const canvasStore = useCanvasStore();
const scriptPicker: Ref<QFile> = ref(null);
const script: Ref<File> = ref(null);
const filePicker: Ref<QFile> = ref(null);
const file: Ref<File> = ref(null);

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
  d3sel
    .select('.sel-rect')
    .attr('rx', D3_CONSTS.RECT_RADIUS)
    .attr('ry', D3_CONSTS.RECT_RADIUS);
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
    const nodes = canvasStore.selectedNodes;
    if (nodes.length != 1) {
      $q.notify({
        message: 'Select only one node to rename it!',
        type: 'negative',
      });
      return;
    }
    const oldName = canvasStore.selectedNodes[0].name;
    $q.dialog({
      title: 'Modify Node Name',
      message: 'What is the new name of the node?',
      prompt: {
        model: oldName,
        isValid: (name) => {
          name = name.trim();
          return (
            isNameValid(name) && d3.select(`.node[data-id=${name}]`).empty()
          );
        },
        type: 'text',
        outlined: true,
      },
      cancel: true,
      persistent: false,
    }).onOk((newName) => {
      renameGroup(
        d3g,
        d3sel,
        d3g.select('.node[data-id=' + oldName + ']'),
        newName
      );
    });
  });
  d3com.selectAll<SVGGElement, unknown>('.command.delete').on('click', () => {
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
      canvasStore.canvasTransform = e.transform.toString();
    }
  }

  function handleDragStart(
    this: Element,
    e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
  ) {
    const pointer = d3.pointer(e, this);
    const x = pointer[0];
    const y = pointer[1];
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
    const pointer = d3.pointer(e, this);
    const x = pointer[0];
    const y = pointer[1];
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
    const pointer = d3.pointer(e, this);
    const x = pointer[0];
    const y = pointer[1];
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
        const coords = extractTranslateCoords(this.getAttribute('transform'));
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
                e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
              ) {
                const coords = extractTranslateCoords(d3sel.attr('transform'));
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
              d3com.attr('visibility', null).attr('transform', function (this) {
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

  initSVG();
});

const allowDrop = (e: DragEvent) => {
  e.preventDefault();
};

const drop = (e: DragEvent) => {
  e.preventDefault();
  const clazz = e.dataTransfer.getData('text');
  if (clazz === 'rain.nodes.custom.custom.CustomNode') {
    void router.push({ name: 'editor' });
  } else {
    if (!configStore.nodeStructures.has(clazz)) {
      $q.notify({
        message: 'No node exists with class: ' + clazz,
        type: 'negative',
      });
      return;
    }
    $q.dialog({
      title: 'Node Name',
      message: 'What is the name of the node?',
      prompt: {
        model: getNextNodeId(
          d3g,
          configStore.getNodeStructureByNodePackage(clazz).clazz
        ),
        isValid: (name) => {
          name = name.trim();
          return (
            isNameValid(name) && d3.select(`.node[data-id=${name}]`).empty()
          );
        },
        type: 'text',
        outlined: true,
      },
      cancel: true,
      persistent: false,
      ok: {
        'data-cy': 'okBtn',
      },
    }).onOk((name) => {
      dropNode(e.offsetX, e.offsetY, clazz, name);
    });
  }
};

const dropNode = (x: number, y: number, clazz: string, id?: string) => {
  clearSelection(d3g);
  const nodeStructure = configStore.getNodeStructureByNodePackage(clazz);
  const identifier = id ? id : getNextNodeId(d3g, nodeStructure.clazz);
  const transform = d3.zoomTransform(d3elem);
  const addedNode = createNode(d3g, d3sel, {
    name: identifier,
    package: clazz,
    x: transform.invertX(x),
    y: transform.invertY(y),
    selected: false,
  });
  configStore.setNodeConfig(clazz, identifier);
  selectNode(addedNode.node(), d3g, false);
};

const initSVG = () => {
  canvasStore.selectedNodes = [];
  canvasStore.canvasNodes.forEach((n) => {
    n.selected = false;
  });
  const tempNodes = new Map<string, DataType>([
    ...canvasStore.canvasNodes.entries(),
  ]);
  const tempEdges = new Map<string, PathElements>([
    ...canvasStore.canvasEdges.entries(),
  ]);
  d3g.selectAll('.node').remove();
  d3g.selectAll('.edge').remove();
  const {
    groups: { x, y, k },
  } = /translate\((?<x>.+?)[, ]+(?<y>.+?)\) scale\((?<k>.+?)\)/gim.exec(
    canvasStore.canvasTransform
  );
  d3svg.call(d3.zoom().transform, new d3.ZoomTransform(+k, +x, +y));
  d3g.attr('transform', canvasStore.canvasTransform);
  tempNodes.forEach((d) => {
    createNode(d3g, d3sel, d);
  });
  tempEdges.forEach((p) => {
    createEdge(d3g, p);
  });
  checkPorts(d3g);
};

const loadFile = async (isScript: boolean) => {
  if (isScript && (await loadUIFromScript(script.value))) {
    $q.notify({
      message: 'Script file loaded successfully',
      type: 'positive',
    });
    initSVG();
  } else if (!isScript && (await loadUIFromFile(file.value))) {
    $q.notify({
      message: 'UI file loaded successfully',
      type: 'positive',
    });
    initSVG();
  } else {
    $q.notify({
      message: 'Error while loading the UI file',
      type: 'negative',
    });
  }
  script.value = null;
  file.value = null;
};

const saveUI = () => {
  const uiState = getUIState();
  downloadUI(uiState);
};

const saveScript = async () => {
  const config = getNodesConfig();

  await api
    .post<string>('/config/convert', config)
    .then((res) => {
      downloadPythonScript(res.data);
    })
    .catch((error: Error) => {
      $q.notify({
        message: error.message,
        type: 'negative',
      });
    });
};
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
