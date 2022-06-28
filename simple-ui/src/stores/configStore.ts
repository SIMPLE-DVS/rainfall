import { defineStore } from 'pinia';
import {
  ComponentTypeRegexes,
  NodeInfo,
  SimpleNodeStructure,
} from 'src/components/models';

export const useConfigStore = defineStore('config', {
  state: () => ({
    nodeStructures: new Map<string, SimpleNodeStructure>(),
    nodeConfigs: new Map<string, { [index: string]: unknown }>(),
    nodeAnyConfigs: new Map<string, string>(),
  }),
  getters: {
    getNodeStructureByNodePackage: (state) => (id: string) =>
      state.nodeStructures.get(id),
    getPackageFromClazz: (state) => (clazz: string) =>
      [...state.nodeStructures.values()].find(
        (structure) => structure.clazz == clazz
      ).package,
  },
  actions: {
    clearNodeStructures() {
      this.$state.nodeStructures = new Map<string, SimpleNodeStructure>();
    },
    clearNodeConfigs() {
      this.$state.nodeConfigs = new Map<string, { [index: string]: unknown }>();
      this.$state.nodeAnyConfigs = new Map<string, string>();
    },
    addNodeStructure(structure: SimpleNodeStructure) {
      this.$state.nodeStructures.set(structure.package, structure);
    },
    setNodeStructures(structures: SimpleNodeStructure[]) {
      this.$state.nodeStructures = new Map(
        structures.map((n) => {
          if (n.input == null) {
            n.input = {};
          }
          if (n.output == null) {
            n.output = {};
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
    setNodeConfig(clazz: string, id: string) {
      const nodeStructure: SimpleNodeStructure = this.nodeStructures.get(clazz);
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
            this.nodeAnyConfigs.set(id + '$' + p.name, 'str');
            break;
          case ComponentTypeRegexes.get('Tuple').exec(p.type)?.input:
            nodeConfigContent[p.name] = null;
            break;
          default:
            nodeConfigContent[p.name] = null;
            break;
        }
      });
      this.nodeConfigs.set(id, nodeConfigContent);
    },
    removeNodeConfig(name: string) {
      this.nodeConfigs.delete(name);
      [...this.nodeAnyConfigs.keys()].forEach((s) => {
        if (s.split('$')[0] === name) {
          this.nodeAnyConfigs.delete(s);
        }
      });
    },
    cloneNodeConfig(original: NodeInfo, clone: string) {
      const configToClone = { ...this.nodeConfigs.get(original.name) };
      if (configToClone) {
        this.nodeConfigs.set(clone, configToClone);
        const nodeStructure: SimpleNodeStructure = this.nodeStructures.get(
          original.package
        );
        nodeStructure.parameter.forEach((p) => {
          if (/^any$/i.test(p.type)) {
            this.nodeAnyConfigs.set(
              clone + '$' + p.name,
              this.nodeAnyConfigs.get(original.name + '$' + p.name)
            );
          }
        });
      }
    },
  },
});
