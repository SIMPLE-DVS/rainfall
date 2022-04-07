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

export const ManageableComponentTypes = new Map<string, string>([
  ['str', 'StringConfigComponent'],
  ['bool', 'BoolConfigComponent'],
  ['int', 'IntConfigComponent'],
  ['float', 'FloatConfigComponent'],
  ['list[str]', 'ListConfigComponent'],
  ['list[bool]', 'ListConfigComponent'],
  ['list[int]', 'ListConfigComponent'],
  ['list[float]', 'ListConfigComponent'],
  ['list of str', 'ListConfigComponent'],
  ['list of bool', 'ListConfigComponent'],
  ['list of int', 'ListConfigComponent'],
  ['list of float', 'ListConfigComponent'],
]);

export interface NodeInfo {
  name: string;
  package: string;
}

export interface AnyParameterConfig {
  type: string;
  value: unknown;
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
  input: unknown;
  output: unknown;
  parameter: SimpleNodeParameter[];
  methods: unknown;
  tags: {
    library: string;
    type: string;
  };
  name: string;
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
