import StringConfigComponent from 'components/nodeConfigComponents/StringConfigComponent.vue';
import BoolConfigComponent from 'components/nodeConfigComponents/BoolConfigComponent.vue';
import IntConfigComponent from 'components/nodeConfigComponents/IntConfigComponent.vue';
import FloatConfigComponent from 'components/nodeConfigComponents/FloatConfigComponent.vue';
import ListConfigComponent from 'components/nodeConfigComponents/ListConfigComponent.vue';
import SelectConfigComponent from 'components/nodeConfigComponents/SelectConfigComponent.vue';
import AnyConfigComponent from 'components/nodeConfigComponents/AnyConfigComponent.vue';
import TupleConfigComponent from 'components/nodeConfigComponents/TupleConfigComponent.vue';
import { Component, markRaw } from 'vue';

export const ComponentTypeRegexes = new Map<string, RegExp>([
  ['String', /^str$/i],
  ['Bool', /^bool$/i],
  ['Int', /^int$/i],
  ['Float', /^float$/i],
  [
    'List',
    /^list of (.+)$|^list\[(.+)\]$|^.+ or list of (.+)$|^.+ or list\[(.+)\]$/i,
  ],
  ['Select', /^\{.+\}$/],
  ['Any', /^any$/i],
  ['Tuple', /^tuple\[(.+)\]$/i],
]);

export const ManageableComponentTypes = new Map<string, Component>([
  ['str', markRaw(StringConfigComponent)],
  ['bool', markRaw(BoolConfigComponent)],
  ['int', markRaw(IntConfigComponent)],
  ['float', markRaw(FloatConfigComponent)],
  ['list[str]', markRaw(ListConfigComponent)],
  ['list[bool]', markRaw(ListConfigComponent)],
  ['list[int]', markRaw(ListConfigComponent)],
  ['list[float]', markRaw(ListConfigComponent)],
  ['list of str', markRaw(ListConfigComponent)],
  ['list of bool', markRaw(ListConfigComponent)],
  ['list of int', markRaw(ListConfigComponent)],
  ['list of float', markRaw(ListConfigComponent)],
]);

export const AvailableComponents = new Map<string, Component>([
  ['StringConfigComponent', markRaw(StringConfigComponent)],
  ['BoolConfigComponent', markRaw(BoolConfigComponent)],
  ['IntConfigComponent', markRaw(IntConfigComponent)],
  ['FloatConfigComponent', markRaw(FloatConfigComponent)],
  ['ListConfigComponent', markRaw(ListConfigComponent)],
  ['SelectConfigComponent', markRaw(SelectConfigComponent)],
  ['AnyConfigComponent', markRaw(AnyConfigComponent)],
  ['TupleConfigComponent', markRaw(TupleConfigComponent)],
]);

export interface NodeInfo {
  name: string;
  package: string;
}

export interface SimpleNodeParameter {
  name: string;
  type: string;
  is_mandatory: boolean;
  description: string;
  default_value: unknown;
}

export interface SimpleNodeStructure {
  package: string;
  clazz: string;
  input: { [index: string]: string };
  output: { [index: string]: string };
  parameter: SimpleNodeParameter[];
  methods: string[];
  tags: {
    library: string;
    type: string;
  };
  description: string;
}

export interface CustomNodeStructure extends SimpleNodeStructure {
  function_name: string;
  code: string;
}

export interface QTreeNode {
  label: string;
  selectable?: boolean;
  children?: QTreeNode[];
  header?: string;
  body?: string;
  story?: {
    library: string;
    type: string;
  };
  id: string;
}

export interface Repository {
  name: string;
  type: string;
}
