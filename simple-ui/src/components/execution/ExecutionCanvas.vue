<template>
  <q-splitter class="absolute-full" v-model="splitterModel">
    <template v-slot:before>
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
    <template v-slot:separator>
      <q-avatar
        color="primary"
        text-color="white"
        size="40px"
        icon="drag_indicator"
      />
    </template>
    <template v-slot:after>
      <execution-panel> </execution-panel>
    </template>
  </q-splitter>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import * as d3 from 'd3';
import { event } from 'quasar';
import { useCanvasStore } from 'src/stores/canvasStore';
import ExecutionPanel from './ExecutionPanel.vue';
import { createExecutionEdge, createExecutionNode } from './models';
import { socket } from 'src/boot/socket';

export default defineComponent({
  name: 'ExecutionCanvas',

  components: { ExecutionPanel },

  setup() {
    const canvasStore = useCanvasStore();
    const splitterModel = ref(66);

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
        const markSize = 128;
        d3g
          .node()
          .append(
            new DOMParser().parseFromString(
              '<svg xmlns="http://www.w3.org/2000/svg" class="mark" height="' +
                markSize +
                'px" width="' +
                markSize +
                'px" viewBox="0 0 24 24" x="' +
                (node.x - markSize / 2) +
                '" y="' +
                (node.y - markSize / 2) +
                '" fill="#1976d2"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
              'image/svg+xml'
            ).documentElement
          );
      }
    };

    const executionListener = (event: string) => {
      const line = event + (event.endsWith('\n') ? '' : '\n');
      handleNewLogLine(line);
    };

    const initSVG = () => {
      d3g.selectAll('.node').remove();
      d3g.selectAll('.edge').remove();
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

      socket.off('execution', executionListener);
      socket.on('execution', executionListener);
    };

    return {
      splitterModel,
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
</style>
