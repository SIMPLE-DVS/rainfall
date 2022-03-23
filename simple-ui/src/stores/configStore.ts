import { defineStore } from 'pinia';
import { FabricNode } from 'src/components/fabricModels';
import {
  AnyParameterConfig,
  ComponentTypeRegexes,
  SimpleNodeStructure,
} from 'src/components/models';

export const useConfigStore = defineStore('config', {
  state: () => ({
    nodeStructures: new Map<string, SimpleNodeStructure>(),
    nodeConfigs: new Map<string, { [index: string]: unknown }>(),
    nodeAnyConfigs: new Map<string, AnyParameterConfig>(),
  }),
  getters: {
    getNodeStructureByNodePackage: (state) => (id: string) =>
      state.nodeStructures.get(id),
  },
  actions: {
    addNodeStructure(structure: SimpleNodeStructure) {
      this.$state.nodeStructures.set(structure.package, structure);
    },
    setNodeStructures(structures: SimpleNodeStructure[]) {
      this.$state.nodeStructures = new Map(
        structures.map((n) => {
          if (n.input == null) {
            n.input = new Map<string, string>();
          }
          if (n.output == null) {
            n.output = new Map<string, string>();
          }
          if (n.parameter == null) {
            n.parameter = [];
          }
          if (n.package === 'rain.nodes.custom.custom.CustomNode') {
            n.parameter = [];
            return [n.package, n];
          } else {
            return [n.package, n];
          }
        })
      );
    },
    setNodeConfig(node: FabricNode) {
      const nodeStructure: SimpleNodeStructure = this.nodeStructures.get(
        node.nodePackage
      );
      const nodeConfigContent: { [index: string]: unknown } = {};
      nodeStructure.parameter.forEach((p) => {
        switch (p.type) {
          case ComponentTypeRegexes.get('String').exec(p.type)?.input:
          case ComponentTypeRegexes.get('Bool').exec(p.type)?.input:
          case ComponentTypeRegexes.get('Int').exec(p.type)?.input:
          case ComponentTypeRegexes.get('Float').exec(p.type)?.input:
          case ComponentTypeRegexes.get('List').exec(p.type)?.input:
          case ComponentTypeRegexes.get('Select').exec(p.type)?.input:
            nodeConfigContent[p.name] = p.default_value;
            break;
          case ComponentTypeRegexes.get('Any').exec(p.type)?.input:
            nodeConfigContent[p.name] = null;
            this.nodeAnyConfigs.set(node.name + '$' + p.name, {
              type: 'str',
              value: null,
            });
            break;
          case ComponentTypeRegexes.get('Tuple').exec(p.type)?.input:
            nodeConfigContent[p.name] = null;
            break;
          default:
            nodeConfigContent[p.name] = null;
            break;
        }
      });
      this.nodeConfigs.set(node.name, nodeConfigContent);
    },
    removeNodeConfig(node: FabricNode) {
      this.nodeConfigs.delete(node.name);
      [...this.nodeAnyConfigs.keys()].forEach((s) => {
        if (s.split('$')[0] === node.name) {
          this.nodeAnyConfigs.delete(s);
        }
      });
    },
    cloneNodeConfig(from: FabricNode, to: FabricNode) {
      const configToClone = { ...this.nodeConfigs.get(from.name) };
      if (configToClone) {
        this.nodeConfigs.set(to.name, configToClone);
        const nodeStructure: SimpleNodeStructure = this.nodeStructures.get(
          from.nodePackage
        );
        nodeStructure.parameter.forEach((p) => {
          if (/^any$/i.test(p.type)) {
            this.nodeAnyConfigs.set(to.name + '$' + p.name, {
              ...this.nodeAnyConfigs.get(from.name + '$' + p.name),
            });
          }
        });
      }
    },
  },
});
