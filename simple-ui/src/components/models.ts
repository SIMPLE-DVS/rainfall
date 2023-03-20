/*
 Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
 Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

export const ComponentTypeRegexes = new Map<string, RegExp>([
  ['String', /^str$/i],
  ['Bool', /^bool$/i],
  ['Int', /^int$/i],
  ['Float', /^float$/i],
  [
    'List',
    /^list of (.+)$|^list\[(.+)\]$|^.+ or list of (.+)$|^.+ or list\[(.+)\]$/i,
  ],
  ['Select', /^\{.+\}$|^\[.+\]$/],
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
