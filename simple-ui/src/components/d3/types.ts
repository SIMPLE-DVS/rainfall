import { AnyParameterConfig, SimpleNodeStructure } from '../models';

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

export interface UIFile {
  nodes: [string, DataType][];
  edges: [string, PathElements][];
  transform: string;
  structures: [string, SimpleNodeStructure][];
  configs: [string, { [index: string]: unknown }][];
  anyConfigs: [string, AnyParameterConfig][];
}
