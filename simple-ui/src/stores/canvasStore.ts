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

import { defineStore } from 'pinia';
import { DataType, PathElements } from 'src/components/d3/types';
import { NodeInfo } from 'src/components/models';

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    canvasNodes: new Map<string, DataType>(),
    canvasEdges: new Map<string, PathElements>(),
    canvasTransform: 'translate(0,0) scale(1)',
    selectedNodes: [] as NodeInfo[],
    doubleClick: false,
  }),
  actions: {
    clearCanvasNodes() {
      this.canvasNodes = new Map<string, DataType>();
    },
    clearCanvasEdges() {
      this.canvasEdges = new Map<string, PathElements>();
    },
  },
});
