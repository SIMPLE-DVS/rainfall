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

import { SimpleNodeStructure } from '../models';

export const D3_CONSTS = {
  PORT_RADIUS: 12,
  RECT_RADIUS: 10,
  FONT_SIZE: '20px',
  TITLE_FONT_SIZE: '32px',
  SELECTION_OFFSET: 5,
  COMMAND_SIZE: 48,
  COMMAND_OFFSET: 6,
};

export interface DataType {
  name: string;
  package: string;
  x: number;
  y: number;
  selected?: boolean;
}

export interface GenericCoords {
  x: number;
  y: number;
}

export interface PathCoords {
  xFrom: number;
  yFrom: number;
  xTo: number;
  yTo: number;
}

export interface PathElements {
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

export interface UIState {
  nodes: { [_: string]: DataType };
  edges: { [_: string]: PathElements };
  transform: string;
  structures: { [_: string]: SimpleNodeStructure };
  configs: { [_: string]: { [_: string]: unknown } };
  anyConfigs: { [_: string]: string };
}

export interface ReversedScript {
  nodes: {
    node: string;
    clazz: string;
    pos: number[];
    params: {
      key: string;
      value: string;
      type?: string;
    }[];
  }[];
  custom: {
    function_name: string;
    clazz: string;
    code: string;
    inputs: string[];
    outputs: string[];
    params: string[];
  }[];
  edges: {
    from_node: string;
    from_var: string;
    to_node: string;
    to_var: string;
  }[];
}
