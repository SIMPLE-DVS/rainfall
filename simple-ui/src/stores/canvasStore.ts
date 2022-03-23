import { defineStore } from 'pinia';
import {
  FabricNode,
  FabricEdge,
  FabricPort,
  IOType,
  InputFabricPort,
  OutputFabricPort,
} from 'src/components/fabricModels';

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    canvasGrid: false,
    canvasNodes: new Map<string, FabricNode>(),
    canvasEdges: new Map<string, FabricEdge>(),
    canvasTransform: [1, 0, 0, 1, 0, 0],
    selectedNode: null as FabricNode,
    selectedPort: null as FabricPort,
    selectedEdge: null as FabricEdge,
    doubleClick: false,
    uiFile: null as { [index: string]: unknown },
  }),
  getters: {
    getCompatiblePorts: (state) => (port: FabricPort) => {
      const compatiblePorts = [] as FabricPort[];
      state.canvasNodes.forEach((n) =>
        compatiblePorts.push(...(n.getObjects('port') as FabricPort[]))
      );
      return compatiblePorts.filter(
        (p) =>
          p.group.name != port.group.name &&
          (p.paramType == port.paramType ||
            p.paramType === 'custom' ||
            port.paramType === 'custom') &&
          p.ioType != port.ioType
      );
    },
    getTopMostPort: (state) => (ports: FabricPort[]) => {
      const allPorts = [] as FabricPort[];
      state.canvasNodes.forEach((n) =>
        allPorts.push(...(n.getObjects('port') as FabricPort[]))
      );
      return ports.reduce((previous, current) =>
        allPorts.indexOf(previous) > allPorts.indexOf(current)
          ? previous
          : current
      );
    },
  },
  actions: {
    addCanvasNode(node: FabricNode) {
      this.canvasNodes.set(node.name, node);
    },
    addCanvasEdge(edge: FabricEdge) {
      this.canvasEdges.set(edge.name, edge);
    },
    removeCanvasNode(nodeId: string) {
      this.canvasNodes.delete(nodeId);
    },
    removeCanvasEdge(edgeId: string) {
      this.canvasEdges.delete(edgeId);
    },
    clearCanvasNodes() {
      this.canvasNodes = new Map<string, FabricNode>();
    },
    clearCanvasEdges() {
      this.canvasEdges = new Map<string, FabricEdge>();
    },
    highlightCompatibleUnconnectedPorts(port: FabricPort, highlight: boolean) {
      this.getCompatiblePorts(port).forEach((p) => {
        if (p.ioType == IOType.INPUT) {
          if (!(p as InputFabricPort).edge) {
            p.fill = highlight ? '#E7FF53' : 'gray';
          }
        } else {
          if ((p as OutputFabricPort).edges.length == 0) {
            p.fill = highlight ? '#E7FF53' : 'gray';
          }
        }
        p.group.dirty = true;
      });
    },
  },
});
