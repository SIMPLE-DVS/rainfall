<template>
  <div
    style="
      position: absolute;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      border: 0;
    "
    v-droppable
    @v-drag-drop="handleDrop"
  >
    <canvas
      id="canvas"
      style="
        position: absolute;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        border: 0;
      "
    ></canvas>

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
import { onMounted, defineComponent, ref, watch, onUnmounted } from 'vue';
import { droppable } from 'v-drag-drop';
import { fabric } from 'fabric';
import { debounce, event, useQuasar } from 'quasar';
import CustomNodeDialog from './customNode/CustomNodeDialog.vue';
import { useCanvasStore } from 'stores/canvasStore';
import { useConfigStore } from 'stores/configStore';
import { useCustomStore } from 'stores/customStore';
import {
  AnyParameterConfig,
  CustomNodeStructure,
  SimpleNodeParameter,
  SimpleNodeStructure,
} from './models';
import {
  disconnectEdge,
  FabricEdge,
  FabricNode,
  FabricPort,
  InputFabricPort,
  IOType,
  OutputFabricPort,
} from './fabricModels';

// TODO: maybe add events in template https://v3.vuejs.org/guide/events.html#exact-modifier
// TODO: watch canvas parent size and invoke the resize method
export default defineComponent({
  name: 'FabricComponent',

  components: { CustomNodeDialog },

  directives: { droppable },

  setup() {
    const $q = useQuasar();
    const canvasStore = useCanvasStore();
    const configStore = useConfigStore();
    const customStore = useCustomStore();

    const backgroundImg = require('../assets/back.png');

    let canvas: HTMLCanvasElement;
    let fabricCanvas: fabric.Canvas;
    let dragPosition: { top: number; left: number } = null;
    const showCustomNodeDialog = ref(false);
    let initialPosition: { top: number; left: number } = null;
    let rightDown = false;
    let clipboard = '';

    const createCanvasNodeId = (nodeClass: string) => {
      let nodeId = '';
      for (let i = 1; true; i++) {
        nodeId = `${nodeClass}${i}`;
        if (!canvasStore.canvasNodes.has(nodeId)) {
          break;
        }
      }

      return nodeId;
    };

    const createCanvasNode = (
      centerX: number,
      centerY: number,
      nodePackage: string,
      nodeName?: string
    ) => {
      const nodeStructure: SimpleNodeStructure =
        configStore.getNodeStructureByNodePackage(nodePackage);
      const inputs = new Map<string, string>(
        Object.entries(nodeStructure.input)
      );
      const outputs = new Map<string, string>(
        Object.entries(nodeStructure.output)
      );
      const node = new FabricNode(
        nodeName ? nodeName : createCanvasNodeId(nodeStructure.clazz),
        nodeStructure.name,
        nodePackage,
        centerX,
        centerY,
        inputs,
        outputs
      );

      return node;
    };

    const getNextNodeStructureId = () => {
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

    const addCustomCanvasNode = () => {
      const className = customStore.name.replace(/\s/g, '');
      const center = fabricCanvas.getVpCenter();
      const nodeId = createCanvasNodeId(className);
      const nodeStructureId = getNextNodeStructureId();
      const inputsMap = new Map<string, string>(
        customStore.inputs.map((i) => [i, 'custom'])
      );
      const outputsMap = new Map<string, string>(
        customStore.outputs.map((o) => [o, 'custom'])
      );
      const inputs = [...inputsMap.entries()].reduce(
        (acc, value) => Object.assign(acc, { [value[0]]: value[1] }),
        {}
      );
      const outputs = [...outputsMap.entries()].reduce(
        (acc, value) => Object.assign(acc, { [value[0]]: value[1] }),
        {}
      );
      const parameters = customStore.parameters.map((p) => {
        return {
          name: p,
          type: 'Any',
          is_mandatory: false,
          description: 'Custom Parameter: ' + p,
          default_value: null,
        } as SimpleNodeParameter;
      });

      const node = new FabricNode(
        nodeId,
        customStore.name,
        nodeStructureId,
        center.x,
        center.y,
        inputsMap,
        outputsMap
      );

      const nodeStructure: CustomNodeStructure = {
        package: nodeStructureId,
        clazz: className,
        input: inputs,
        output: outputs,
        parameter: parameters,
        methods: [] as string[],
        tags: {
          library: 'Custom',
          type: 'Custom',
        },
        name: customStore.name,
        description: 'A Custom Node.',
        function_name: customStore.function_name,
        code: customStore.code,
      };

      if (!customStore.editMode) {
        fabricCanvas.add(node);
        canvasStore.addCanvasNode(node);
      }

      configStore.addNodeStructure(nodeStructure);
      configStore.setNodeConfig(node);
      fabricCanvas.setActiveObject(node);

      return node;
    };

    const resizeCanvas = () => {
      const rect = canvas.parentElement.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      fabricCanvas.setWidth(rect.width);
      fabricCanvas.setHeight(rect.height);
    };

    const mouseDown = (opt: fabric.IEvent<MouseEvent>) => {
      if (event.leftClick(opt.e)) {
        const pt = fabricCanvas.getPointer(opt.e, false);
        initialPosition = { left: pt.x, top: pt.y };
      }
      if (event.rightClick(opt.e)) {
        dragPosition = { left: opt.e.x, top: opt.e.y };
        fabricCanvas.selection = false;
        rightDown = true;
      }
    };

    const mouseUp = (opt: fabric.IEvent<MouseEvent>) => {
      initialPosition = null;
      rightDown = false;
      dragPosition = null;
      fabricCanvas.selection = true;

      if (canvasStore.selectedPort != null) {
        if (event.leftClick(opt.e)) {
          const compatiblePorts = canvasStore.getCompatiblePorts(
            canvasStore.selectedPort as FabricPort
          );
          const portsContainingMouse = compatiblePorts.filter((p) =>
            p.containsMousePoint(opt.absolutePointer)
          );

          if (portsContainingMouse.length == 0) {
            fabricCanvas.fxRemove(canvasStore.selectedEdge);
          } else {
            const topMostPort =
              portsContainingMouse.length == 1
                ? portsContainingMouse[0]
                : canvasStore.getTopMostPort(portsContainingMouse);
            const edgeName1 =
              canvasStore.selectedPort.name + '|' + topMostPort.name;
            const edgeName2 =
              topMostPort.name + '|' + canvasStore.selectedPort.name;
            if (
              canvasStore.canvasEdges.has(edgeName1) ||
              canvasStore.canvasEdges.has(edgeName2)
            ) {
              fabricCanvas.fxRemove(canvasStore.selectedEdge);
            } else {
              canvasStore.selectedEdge.connectToPort(topMostPort);
            }
          }

          canvasStore.highlightCompatibleUnconnectedPorts(
            canvasStore.selectedPort as FabricPort,
            false
          );

          canvasStore.selectedPort.group.lockMovementX = false;
          canvasStore.selectedPort.group.lockMovementY = false;
          canvasStore.selectedPort = null;
          canvasStore.selectedEdge = null;
          fabricCanvas.requestRenderAll();
        }
      }
    };

    const mouseMove = (opt: fabric.IEvent<MouseEvent>) => {
      if (dragPosition) {
        let deltaX = 0;
        let deltaY = 0;
        let currentPosition = { left: opt.e.x, top: opt.e.y };
        deltaX = currentPosition.left - dragPosition.left;
        deltaY = currentPosition.top - dragPosition.top;
        dragPosition = currentPosition;
        let delta = new fabric.Point(deltaX, deltaY);
        if (rightDown) {
          fabricCanvas.relativePan(delta);
          canvasStore.canvasTransform = fabricCanvas.viewportTransform;
        }
      }
      if (canvasStore.selectedEdge != null) {
        canvasStore.selectedEdge.updateCoords(
          opt.absolutePointer.x,
          opt.absolutePointer.y
        );
        fabricCanvas.requestRenderAll();
      }
    };

    const mouseWheel = (opt: fabric.IEvent<WheelEvent>) => {
      var delta = event.getMouseWheelDistance(opt.e).y;
      var zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      if (initialPosition) {
        fabricCanvas.zoomToPoint(
          { x: initialPosition.left, y: initialPosition.top },
          zoom
        );
        fabricCanvas.clearContext(fabricCanvas.getSelectionContext());
        fabricCanvas.renderAll();
      } else {
        fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      }
      canvasStore.canvasTransform = fabricCanvas.viewportTransform;
      event.stopAndPrevent(opt.e);
    };

    const handleDrop = (d: string, _: boolean, e: DragEvent) => {
      if (d === 'rain.nodes.custom.custom.CustomNode') {
        showCustomNodeDialog.value = true;
      } else {
        const pt = fabricCanvas.getPointer(e);
        const node = createCanvasNode(pt.x, pt.y, d);
        fabricCanvas.add(node);
        canvasStore.addCanvasNode(node);
        configStore.setNodeConfig(node);
        fabricCanvas.setActiveObject(node);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Delete':
          if (
            document.activeElement?.nodeName === 'BODY' &&
            fabricCanvas.getActiveObjects().length > 0
          ) {
            $q.dialog({
              message: 'Are you sure you want to delete the node(s)?',
              cancel: true,
            }).onOk(() => {
              const nodes = fabricCanvas.getActiveObjects() as FabricNode[];
              nodes.forEach((n) => n.removeNode());
              fabricCanvas.discardActiveObject();
            });
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'c':
          if (
            document.activeElement?.nodeName === 'BODY' &&
            e.ctrlKey &&
            fabricCanvas.getActiveObjects().length > 0
          ) {
            const nodeNames = fabricCanvas
              .getActiveObjects()
              .map((o) => o.name)
              .join('$');
            clipboard = nodeNames;
          }
          break;
        case 'v':
          if (
            document.activeElement?.nodeName === 'BODY' &&
            e.ctrlKey &&
            clipboard.length > 0
          ) {
            const nodeNames = clipboard.split('$');
            const existingNodeNames = nodeNames.filter((nodeName) =>
              canvasStore.canvasNodes.has(nodeName)
            );
            if (existingNodeNames.length == 0) {
              return;
            }
            const originalCloneNodesMap = new Map<string, string>();
            const cloneNodes = [] as FabricNode[];
            existingNodeNames.forEach((nodeName) => {
              const nodeToClone = canvasStore.canvasNodes.get(nodeName);
              if (nodeToClone) {
                const nodeStructure = configStore.getNodeStructureByNodePackage(
                  nodeToClone.nodePackage
                );
                const cloneNodeId = createCanvasNodeId(nodeStructure.clazz);
                originalCloneNodesMap.set(nodeName, cloneNodeId);
                const newCanvasNode = nodeToClone.cloneNode(cloneNodeId);
                fabricCanvas.add(newCanvasNode);
                canvasStore.addCanvasNode(newCanvasNode);
                configStore.cloneNodeConfig(nodeToClone, newCanvasNode);
                cloneNodes.push(newCanvasNode);
              }
            });
            fabricCanvas.discardActiveObject();
            originalCloneNodesMap.forEach((v, k) => {
              canvasStore.canvasNodes.get(k).inputPorts.forEach((to) => {
                const edge = to.edge;
                if (!edge) {
                  return;
                }
                const from = edge.from;
                if (!originalCloneNodesMap.has(from.group.name)) {
                  return;
                }
                const cloneInputPort = canvasStore.canvasNodes
                  .get(v)
                  .inputPorts.find((p) => p.paramName == to.paramName);
                const cloneOutputPort = canvasStore.canvasNodes
                  .get(originalCloneNodesMap.get(from.group.name))
                  .outputPorts.find((p) => p.paramName == from.paramName);
                const newEdgeBetweenClones = new FabricEdge(cloneInputPort);
                fabricCanvas.add(newEdgeBetweenClones);
                newEdgeBetweenClones.connectToPort(cloneOutputPort);
              });
            });
            const cloneSelection = new fabric.ActiveSelection(cloneNodes, {
              canvas: fabricCanvas,
            });
            fabricCanvas.setActiveObject(cloneSelection);
            if (cloneNodes.length == 1) {
              canvasStore.selectedNode = cloneNodes[0];
            }
            fabricCanvas.setViewportTransform(canvasStore.canvasTransform);
            fabricCanvas.requestRenderAll();
          }
          break;
      }
    };

    const onYesClicked = () => {
      if (fabricCanvas.getActiveObjects().length > 0) {
        const nodes = fabricCanvas.getActiveObjects() as FabricNode[];
        nodes.forEach((n) => n.removeNode());
        fabricCanvas.discardActiveObject();
      }
    };

    const handleSelection = (opt: fabric.IEvent<Event>) => {
      if (opt.target instanceof FabricNode) {
        canvasStore.selectedNode = opt.target;
      }
    };

    const handleClearSelection = () => {
      canvasStore.selectedNode = null;
    };

    const handleDoubleClick = (opt: fabric.IEvent<Event>) => {
      if (opt.subTargets.length == 1 && opt.subTargets[0].type === 'port') {
        const port = opt.subTargets[0] as FabricPort;
        if (port.ioType == IOType.INPUT) {
          if ((port as InputFabricPort).edge) {
            disconnectEdge((port as InputFabricPort).edge);
          }
        } else {
          [...(port as OutputFabricPort).edges].forEach((e) =>
            disconnectEdge(e)
          );
        }
      } else {
        canvasStore.doubleClick = true;
      }
    };

    const handleObjectMoving = (opt: fabric.IEvent<Event>) => {
      if (opt.target instanceof fabric.Group) {
        opt.target.getObjects('node').forEach((n) => n.fire('moving'));
      }
    };

    const showGrid = (show: boolean) => {
      if (show) {
        fabricCanvas.setBackgroundColor(
          { source: backgroundImg, repeat: 'repeat' } as fabric.Pattern,
          function () {
            fabricCanvas.renderAll();
          }
        );
      } else {
        fabricCanvas.setBackgroundColor('white', function () {
          fabricCanvas.renderAll();
        });
      }
    };

    const setupFabricCanvas = () => {
      canvas = document.getElementById('canvas') as HTMLCanvasElement;
      fabricCanvas = new fabric.Canvas('canvas', {
        fireRightClick: true,
        stopContextMenu: true,
      });
      fabricCanvas.selectionBorderColor = 'black';
      showGrid(canvasStore.canvasGrid);

      fabric.Group.prototype.lockSkewingX = true;
      fabric.Group.prototype.lockSkewingY = true;
      fabric.Group.prototype.lockScalingX = true;
      fabric.Group.prototype.lockScalingY = true;
      fabric.Group.prototype.padding = 5;
      fabric.Group.prototype.controls = {
        ...fabric.Group.prototype.controls,
        mtr: new fabric.Control({ visible: false }),
      };
    };

    const loadUIFileIfExists = () => {
      if (canvasStore.uiFile != null) {
        canvasStore.selectedNode = null;
        canvasStore.selectedPort = null;
        canvasStore.selectedEdge = null;
        canvasStore.doubleClick = false;
        canvasStore.canvasTransform = canvasStore.uiFile[
          'canvasTransform'
        ] as number[];
        fabricCanvas.setViewportTransform(canvasStore.canvasTransform);
        configStore.nodeStructures = new Map<string, SimpleNodeStructure>(
          Object.entries(canvasStore.uiFile['structures'])
        );
        canvasStore.clearCanvasNodes();
        (canvasStore.uiFile['nodes'] as { [index: string]: unknown }[]).forEach(
          (v) => {
            canvasStore.addCanvasNode(
              createCanvasNode(
                v['centerX'] as number,
                v['centerY'] as number,
                v['package'] as string,
                v['name'] as string
              )
            );
          }
        );
        canvasStore.clearCanvasEdges();
        (canvasStore.uiFile['edges'] as string[]).forEach((v) => {
          const fromEdge = v.split('|')[0];
          const toEdge = v.split('|')[1];
          const fromEdgeNodeName = fromEdge.split('-{out}-')[0];
          const fromEdgeParamName = fromEdge.split('-{out}-')[1];
          const toEdgeNodeName = toEdge.split('-{in}-')[0];
          const toEdgeParamName = toEdge.split('-{in}-')[1];
          const fromPort = canvasStore.canvasNodes
            .get(fromEdgeNodeName)
            .getPortFromParamName(IOType.OUTPUT, fromEdgeParamName);
          const toPort = canvasStore.canvasNodes
            .get(toEdgeNodeName)
            .getPortFromParamName(IOType.INPUT, toEdgeParamName);
          const edge = new FabricEdge(fromPort);
          edge.connectToPort(toPort);
        });
        configStore.nodeConfigs = new Map<string, { [index: string]: unknown }>(
          Object.entries(canvasStore.uiFile['configs'])
        );
        configStore.nodeAnyConfigs = new Map<string, AnyParameterConfig>(
          Object.entries(canvasStore.uiFile['anyConfigs'])
        );
        canvasStore.uiFile = null;
      }
    };

    const loadNodesAndEdges = () => {
      let nodes = canvasStore.canvasNodes;
      nodes.forEach((n: FabricNode) => {
        fabricCanvas.add(n);
        n.removeGroupInfoIfInsideGroup();
      });
      // TODO: customNodes
      let edges = canvasStore.canvasEdges;
      edges.forEach((e) => {
        fabricCanvas.add(e);
      });
      if (canvasStore.selectedNode != null) {
        fabricCanvas.setActiveObject(nodes.get(canvasStore.selectedNode.name));
      }
    };

    const renderCanvas = () => {
      resizeCanvas();
      fabricCanvas.setViewportTransform(canvasStore.canvasTransform);
      fabricCanvas.renderAll();
    };

    const addListeners = () => {
      fabricCanvas.on('mouse:down', mouseDown);
      fabricCanvas.on('mouse:up', mouseUp);
      fabricCanvas.on('mouse:move', debounce(mouseMove, 1));
      fabricCanvas.on('mouse:wheel', mouseWheel);
      fabricCanvas.on('selection:created', handleSelection);
      fabricCanvas.on('selection:updated', handleSelection);
      fabricCanvas.on('selection:cleared', handleClearSelection);
      fabricCanvas.on('mouse:dblclick', handleDoubleClick);
      fabricCanvas.on('object:moving', handleObjectMoving);

      window.addEventListener('resize', resizeCanvas, true);
      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('keyup', handleKeyUp, true);
    };

    const watchSelectedPort = () => {
      watch(
        () => canvasStore.selectedPort as FabricPort,
        (newVal: FabricPort, oldVal: FabricPort) => {
          if (newVal != null && !newVal.isConnected()) {
            newVal.fill = '#E7FF53';
            newVal.group.dirty = true;
          }
          if (newVal == null && oldVal != null) {
            if (!oldVal.isConnected()) {
              oldVal.fill = 'gray';
              oldVal.group.dirty = true;
            }
          }
          if (newVal != null) {
            let pt = newVal.getAbsoluteXY();
            newVal.group.lockMovementX = true;
            newVal.group.lockMovementY = true;
            const edge = new FabricEdge(
              newVal,
              newVal.ioType == IOType.INPUT ? pt.x : pt.x + newVal.width,
              pt.y + newVal.height / 2
            );
            canvasStore.selectedEdge = edge;
            fabricCanvas.add(canvasStore.selectedEdge);

            canvasStore.highlightCompatibleUnconnectedPorts(
              canvasStore.selectedPort as FabricPort,
              true
            );
          }
        }
      );
    };

    const watchGridToggle = () => {
      watch(
        () => canvasStore.canvasGrid,
        (newVal) => {
          showGrid(newVal);
        }
      );
    };

    const watchEditCustomNode = () => {
      watch(
        () => customStore.nodeToEdit,
        (newVal) => {
          if (newVal != null) {
            showCustomNodeDialog.value = true;
          }
        }
      );
    };

    const removeListeners = () => {
      window.removeEventListener('resize', resizeCanvas, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };

    onMounted(() => {
      setupFabricCanvas();
      loadUIFileIfExists();
      loadNodesAndEdges();
      renderCanvas();
      addListeners();
      watchSelectedPort();
      watchGridToggle();
      watchEditCustomNode();
    });
    onUnmounted(removeListeners);

    return {
      handleDrop,
      showCustomNodeDialog,
      onYesClicked,
      addCustomCanvasNode,
    };
  },
});
</script>
