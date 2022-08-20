import { defineStore } from 'pinia';
import { DataType, PathElements } from 'src/components/d3/types';
import { NodeInfo } from 'src/components/models';

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    canvasNodes: new Map<string, DataType>(),
    canvasEdges: new Map<string, PathElements>(),
    canvasTransform: 'translate(0,0) scale(1)',
    selectedNodes: [] as NodeInfo[],
    doubleClick: false,
  }),
  actions: {
    clearCanvasNodes() {
      this.canvasNodes = new Map<string, DataType>();
    },
    clearCanvasEdges() {
      this.canvasEdges = new Map<string, PathElements>();
    },
  },
});
