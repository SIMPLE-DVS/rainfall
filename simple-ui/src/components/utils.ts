import { useCanvasStore } from 'src/stores/canvasStore';
import { useConfigStore } from 'src/stores/configStore';
import { useRepoStore } from 'src/stores/repoStore';
import { getUIState } from './d3/utils';
import { CustomNodeStructure } from './models';

export const getConfig = () => {
  const repoStore = useRepoStore();
  if (repoStore.currentRepo == null) {
    throw new Error(
      'No default repository is selected! Mark a repository as default'
    );
  }

  const canvasStore = useCanvasStore();
  const configStore = useConfigStore();

  const config: { [index: string]: unknown } = {};
  config['pipeline_uid'] = Math.floor(100000 * Math.random()).toString();

  config['nodes'] = [...canvasStore.canvasNodes.keys()].map(
    (nodeName: string) => {
      const nodePackage = canvasStore.canvasNodes.get(nodeName).package;
      const nodeConfig: { [index: string]: unknown } = {
        node_id: nodeName,
        node: nodePackage.includes('rain.nodes.custom.custom.CustomNode')
          ? 'rain.nodes.custom.custom.CustomNode'
          : nodePackage,
        parameters: Object.entries(
          configStore.nodeConfigs.get(nodeName)
        ).reduce(
          (acc, value) =>
            value[1] != null
              ? Object.assign(acc, { [value[0]]: value[1] })
              : acc,
          {}
        ),
      };

      if (
        (nodeConfig.node as string).includes(
          'rain.nodes.custom.custom.CustomNode'
        )
      ) {
        nodeConfig['function_name'] = (
          configStore.nodeStructures.get(nodePackage) as CustomNodeStructure
        ).function_name;
        nodeConfig['code'] = (
          configStore.nodeStructures.get(nodePackage) as CustomNodeStructure
        ).code;
      }

      nodeConfig['then'] = [...canvasStore.canvasEdges.values()]
        .filter((e) => e.fromNode == nodeName)
        .map((e) => {
          return {
            to_node: e.toNode,
            from_port: e.fromPort,
            to_port: e.toPort,
          };
        });

      return nodeConfig;
    }
  );

  config['dependencies'] = [...canvasStore.canvasNodes.keys()]
    .map((nodeName) => canvasStore.canvasNodes.get(nodeName).package)
    .map((nodePackage) =>
      configStore.nodeStructures.get(nodePackage).tags['library'].toLowerCase()
    )
    .reduce(
      (acc, value) =>
        value != 'custom' && acc.indexOf(value) == -1 ? acc.concat(value) : acc,
      [] as string[]
    );

  config['ui'] = getUIState();

  config['repository'] = repoStore.currentRepo;

  return config;
};

export const getWebSocketURL = () => {
  const url = new URL(
    process.env.BACKEND_URL == ''
      ? window.location.origin
      : process.env.BACKEND_URL
  );
  const protocol = url.protocol == 'https:' ? 'wss://' : 'ws://';
  return protocol + url.host + '/ws';
};

export const destroyWebSocket = (socket: WebSocket) => {
  if (socket != null) {
    socket.onmessage = null;
    if (socket.readyState == WebSocket.OPEN) {
      socket.close(1000);
    }
  }
};
