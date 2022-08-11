<template>
  <div class="full-space">
    <svg class="d3-svg full-space">
      <g class="graphics">
        <svg
          class="running"
          xmlns:svg="http://www.w3.org/2000/svg"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.0"
          width="128px"
          height="128px"
          viewBox="0 0 128 128"
          xml:space="preserve"
          visibility="hidden"
        >
          <rect x="0" y="0" width="100%" height="100%" opacity="0" />
          <g>
            <path
              d="M38.52 33.37L21.36 16.2A63.6 63.6 0 0 1 59.5.16v24.3a39.5 39.5 0 0 0-20.98 8.92z"
              fill="#1976d2"
              stroke-width="3"
              stroke="#000000"
            />
            <path
              d="M38.52 33.37L21.36 16.2A63.6 63.6 0 0 1 59.5.16v24.3a39.5 39.5 0 0 0-20.98 8.92z"
              fill="#c0c0c0"
              transform="rotate(45 64 64)"
              stroke-width="3"
              stroke="#000000"
            />
            <path
              d="M38.52 33.37L21.36 16.2A63.6 63.6 0 0 1 59.5.16v24.3a39.5 39.5 0 0 0-20.98 8.92z"
              fill="#c0c0c0"
              transform="rotate(90 64 64)"
              stroke-width="3"
              stroke="#000000"
            />
            <path
              d="M38.52 33.37L21.36 16.2A63.6 63.6 0 0 1 59.5.16v24.3a39.5 39.5 0 0 0-20.98 8.92z"
              fill="#c0c0c0"
              transform="rotate(135 64 64)"
              stroke-width="3"
              stroke="#000000"
            />
            <path
              d="M38.52 33.37L21.36 16.2A63.6 63.6 0 0 1 59.5.16v24.3a39.5 39.5 0 0 0-20.98 8.92z"
              fill="#c0c0c0"
              transform="rotate(180 64 64)"
              stroke-width="3"
              stroke="#000000"
            />
            <path
              d="M38.52 33.37L21.36 16.2A63.6 63.6 0 0 1 59.5.16v24.3a39.5 39.5 0 0 0-20.98 8.92z"
              fill="#c0c0c0"
              transform="rotate(225 64 64)"
              stroke-width="3"
              stroke="#000000"
            />
            <path
              d="M38.52 33.37L21.36 16.2A63.6 63.6 0 0 1 59.5.16v24.3a39.5 39.5 0 0 0-20.98 8.92z"
              fill="#c0c0c0"
              transform="rotate(270 64 64)"
              stroke-width="3"
              stroke="#000000"
            />
            <path
              d="M38.52 33.37L21.36 16.2A63.6 63.6 0 0 1 59.5.16v24.3a39.5 39.5 0 0 0-20.98 8.92z"
              fill="#c0c0c0"
              transform="rotate(315 64 64)"
              stroke-width="3"
              stroke="#000000"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 64 64;45 64 64;90 64 64;135 64 64;180 64 64;225 64 64;270 64 64;315 64 64"
              calcMode="discrete"
              dur="720ms"
              repeatCount="indefinite"
            ></animateTransform>
          </g>
        </svg>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import * as d3 from 'd3';
import { event } from 'quasar';
import { useCanvasStore } from 'src/stores/canvasStore';
import { createExecutionEdge, createExecutionNode } from './models';
import { useLogStore } from 'src/stores/logStore';

const canvasStore = useCanvasStore();
const svgSize = 128;
const logStore = useLogStore();

let d3elem: Element = null;
let d3svg: d3.Selection<Element, unknown, null, undefined> = null;
let d3g: d3.Selection<Element, unknown, null, undefined> = null;

onMounted(() => {
  d3elem = document.getElementsByClassName('d3-svg')[0];
  d3svg = d3.select(d3elem);
  d3g = d3svg.selectChild('.graphics');

  function handleZoom(
    this: Element,
    e: d3.D3ZoomEvent<d3.ZoomedElementBaseType, unknown>
  ) {
    if (this == d3elem) {
      d3g.attr('transform', e.transform.toString());
      canvasStore.canvasTransform = e.transform.toString();
    }
  }

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
    .on('dblclick.zoom', null)
    .on('contextmenu', (e: PointerEvent) => {
      event.prevent(e);
    });

  initSVG();
});

const handleNewLogLine = (line: string) => {
  const parts = line.split('|');
  if (parts[0].startsWith('Request received')) {
    d3g.selectAll('.mark').remove();
    d3g.selectAll('.error').remove();
  }
  if (parts.length != 4) {
    return;
  }

  if (
    parts[1] == 'INFO' &&
    parts[3].startsWith('Starting execution of the node')
  ) {
    const nodeName = parts[2].split(':')[1];
    const node = canvasStore.canvasNodes.get(nodeName);
    const runningSVG = d3g.select<SVGSVGElement>('.running').raise();
    runningSVG
      .attr('visibility', null)
      .attr('x', node.x - runningSVG.node().width.baseVal.value / 2)
      .attr('y', node.y - runningSVG.node().height.baseVal.value / 2);
  }
  if (
    parts[1] == 'SUCCESS' &&
    parts[3].startsWith('Node executed succesfully')
  ) {
    d3g.select('.running').attr('visibility', 'hidden');
    const nodeName = parts[2].split(':')[1];
    const node = canvasStore.canvasNodes.get(nodeName);
    d3g
      .node()
      .append(
        new DOMParser().parseFromString(
          '<svg xmlns="http://www.w3.org/2000/svg" class="mark" height="' +
            svgSize +
            'px" width="' +
            svgSize +
            'px" viewBox="0 0 24 24" x="' +
            (node.x - svgSize / 2) +
            '" y="' +
            (node.y - svgSize / 2) +
            '" fill="#00ff00" stroke-width="1" stroke="black"><path d="M0 0h24v24H0z" fill="none" stroke-width="0"/><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
          'image/svg+xml'
        ).documentElement
      );
  }
  if (parts[1] == 'ERROR') {
    d3g.select('.running').attr('visibility', 'hidden');
    const nodeName = parts[2].split(':')[1];
    const node = canvasStore.canvasNodes.get(nodeName);
    d3g
      .node()
      .append(
        new DOMParser().parseFromString(
          '<svg xmlns="http://www.w3.org/2000/svg" class="error" height="' +
            svgSize +
            'px" width="' +
            svgSize +
            'px" viewBox="0 0 24 24" x="' +
            (node.x - svgSize / 2) +
            '" y="' +
            (node.y - svgSize / 2) +
            '" fill="yellow" stroke-width="1" stroke="black"><path d="M0 0h24v24H0z" fill="none" stroke-width="0"/><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
          'image/svg+xml'
        ).documentElement
      );
  }
};

const executionListener = (data: string) => {
  const line = data + (data.endsWith('\n') ? '' : '\n');
  handleNewLogLine(line);
};

const initSVG = () => {
  d3g.selectAll('.node').remove();
  d3g.selectAll('.edge').remove();
  d3g.selectAll('.mark').remove();
  d3g.selectAll('.error').remove();
  const {
    groups: { x, y, k },
  } = /translate\((?<x>.+?)[, ]+(?<y>.+?)\) scale\((?<k>.+?)\)/gim.exec(
    canvasStore.canvasTransform
  );
  d3svg.call(d3.zoom().transform, new d3.ZoomTransform(+k, +x, +y));
  d3g.attr('transform', canvasStore.canvasTransform);
  [...canvasStore.canvasNodes.values()].forEach((n) => {
    createExecutionNode(d3g, n);
  });
  [...canvasStore.canvasEdges.values()].forEach((e) => {
    createExecutionEdge(d3g, e);
  });

  watch(
    () => logStore.executionLogLine,
    (newVal) => {
      executionListener(newVal);
    }
  );
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
</style>
