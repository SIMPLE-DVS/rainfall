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

import * as d3 from 'd3';
import { debounce } from 'quasar';
import { useCanvasStore } from 'src/stores/canvasStore';
import { useConfigStore } from 'src/stores/configStore';
import { D3_CONSTS, DataType, PathElements } from './types';
import {
  calculatePath,
  calculateTextLength,
  checkPorts,
  extractPathCoords,
  extractPathElems,
  extractTranslateCoords,
  getEdgeName,
  getNextNodeId,
  portContainsPoint,
} from './utils';

export function createEdge(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  elems: PathElements
) {
  d3g
    .append('path')
    .classed('edge', true)
    .attr('data-from-parent', elems.fromNode)
    .attr('data-from-port', elems.fromPort)
    .attr('data-to-parent', elems.toNode)
    .attr('data-to-port', elems.toPort)
    .attr('stroke', 'black')
    .attr('stroke-width', 3)
    .attr('fill', 'none')
    .attr('d', () => {
      const coords = extractPathCoords(elems);
      return calculatePath(coords);
    })
    .lower();
  const canvasStore = useCanvasStore();
  canvasStore.canvasEdges.set(getEdgeName(elems), elems);
}

export function createNode(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  d3sel: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: DataType
) {
  const configStore = useConfigStore();
  const nodeStructure = configStore.getNodeStructureByNodePackage(data.package);
  const inputs = new Map<string, string>(Object.entries(nodeStructure.input));
  const outputs = new Map<string, string>(Object.entries(nodeStructure.output));
  const selection = createGroup(d3g, d3sel, data);
  const backgroundRect = createBackgroundRect(selection, d3g, inputs, outputs);
  const titleRect = createTitleRect(selection, backgroundRect);
  createTitle(selection, backgroundRect, titleRect);
  createPorts(selection, backgroundRect, d3g, inputs, outputs);
  createTexts(selection, backgroundRect, inputs, outputs);
  createSeparator(selection, backgroundRect, d3g, inputs, outputs);
  const canvasStore = useCanvasStore();
  canvasStore.canvasNodes.set(data.name, data);
  return selection;
}

function handleGroupDrag(
  this: SVGGElement,
  e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, unknown>
) {
  const datum = d3.select<Element, DataType>(this).datum();
  d3.select(this).attr(
    'transform',
    'translate(' + (datum.x += e.dx) + ',' + (datum.y += e.dy) + ')'
  );

  debounce(() => {
    d3.selectAll<SVGPathElement, unknown>(
      `path[data-from-parent=${this.dataset['id']}],path[data-to-parent=${this.dataset['id']}]`
    ).attr('d', function (this) {
      const coords = extractPathCoords({
        fromNode: this.dataset['fromParent'],
        fromPort: this.dataset['fromPort'],
        toNode: this.dataset['toParent'],
        toPort: this.dataset['toPort'],
      });
      return calculatePath(coords);
    });
  }, 10)();
}

export function selectNode(
  g: SVGGElement | HTMLElement,
  d3g: d3.Selection<Element, unknown, null, undefined>,
  addNode: boolean
) {
  const canvasStore = useCanvasStore();
  if (!addNode) {
    d3g.selectChildren<SVGGElement, DataType>('.node').each((d) => {
      d.selected = false;
    });
    canvasStore.selectedNodes = [];
  }
  d3.select(g).raise();
  d3.select<Element, DataType>(g).datum().selected = true;
  canvasStore.selectedNodes.push({
    name: g.dataset['id'],
    package: g.dataset['package'],
  });
}

export function toggleNode(g: SVGGElement, d: DataType) {
  const canvasStore = useCanvasStore();
  if (d.selected) {
    canvasStore.selectedNodes = canvasStore.selectedNodes.filter(
      (n) => n.name != g.dataset['id']
    );
  } else {
    d3.select(g).classed('hovered', false);
    d3.select(g).raise();
    canvasStore.selectedNodes.push({
      name: g.dataset['id'],
      package: g.dataset['package'],
    });
  }
  d.selected = !d.selected;
}

export function clearSelection(
  d3g: d3.Selection<Element, unknown, null, undefined>
) {
  d3g.selectChildren<SVGGElement, DataType>('.node').each((d) => {
    d.selected = false;
  });
  const canvasStore = useCanvasStore();
  canvasStore.selectedNodes = [];
}

export function copyGroups(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  d3sel: d3.Selection<SVGGElement, unknown, null, undefined>,
  groups: d3.Selection<SVGGElement, unknown, Element, undefined>
) {
  const configStore = useConfigStore();
  const nameMap = new Map<string, string>();
  const newNodes: SVGGElement[] = [];
  groups.each(function (this) {
    const originalName = this.dataset['id'];
    const originalPackage = this.dataset['package'];
    nameMap.set(originalName, getNextNodeId(d3g, originalName));
    const transform = extractTranslateCoords(this.getAttribute('transform'));
    const cloneName = nameMap.get(originalName);
    const clone = createNode(d3g, d3sel, {
      name: cloneName,
      package: originalPackage,
      x: transform.x + 200,
      y: transform.y + 200,
      selected: false,
    });
    configStore.cloneNodeConfig(
      { name: originalName, package: originalPackage },
      cloneName
    );
    newNodes.push(clone.node());
  });
  groups.each(function (this) {
    d3g
      .selectAll<SVGPathElement, unknown>(
        'path[data-to-parent=' + this.dataset['id'] + ']'
      )
      .each(function (this) {
        if (nameMap.has(this.dataset['fromParent'])) {
          createEdge(d3g, {
            fromNode: nameMap.get(this.dataset['fromParent']),
            fromPort: this.dataset['fromPort'],
            toNode: nameMap.get(this.dataset['toParent']),
            toPort: this.dataset['toPort'],
          });
        }
      });
  });

  checkPorts(d3g);
  clearSelection(d3g);
  newNodes.forEach((n) => {
    d3.select<SVGGElement, DataType>(n).raise().datum().selected = true;
  });
  const canvasStore = useCanvasStore();
  canvasStore.selectedNodes = newNodes.map((n) => {
    return { name: n.dataset['id'], package: n.dataset['package'] };
  });
}

export function renameGroup(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  d3sel: d3.Selection<SVGGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  newName: string
) {
  const oldName = g.attr('data-id');
  const oldPackage = g.attr('data-package');
  const coords = extractTranslateCoords(g.attr('transform'));
  const paths = d3g
    .selectAll<SVGPathElement, unknown>(
      'path[data-from-parent=' +
        oldName +
        '],path[data-to-parent=' +
        oldName +
        ']'
    )
    .nodes();
  const pathsElems = paths.map((p) => extractPathElems(p));
  pathsElems.forEach((p) => {
    if (p.fromNode == oldName) {
      p.fromNode = newName;
    }
    if (p.toNode == oldName) {
      p.toNode = newName;
    }
  });
  const renamedNode = createNode(d3g, d3sel, {
    name: newName,
    package: oldPackage,
    x: coords.x,
    y: coords.y,
    selected: false,
  });
  const configStore = useConfigStore();
  configStore.cloneNodeConfig({ name: oldName, package: oldPackage }, newName);
  deleteGroup(d3g, d3g.select('.node[data-id=' + oldName + ']'));
  pathsElems.forEach((p) => createEdge(d3g, p));
  checkPorts(d3g);
  selectNode(renamedNode.node(), d3g, false);
}

function deleteEdge(path: SVGPathElement) {
  const pathElems = extractPathElems(path);
  const canvasStore = useCanvasStore();
  canvasStore.canvasEdges.delete(getEdgeName(pathElems));
  path.remove();
}

export function deleteGroup(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>
) {
  const name = g.attr('data-id');
  d3g
    .selectAll<SVGPathElement, unknown>(
      'path[data-from-parent=' + name + '],path[data-to-parent=' + name + ']'
    )
    .nodes()
    .forEach((p) => {
      deleteEdge(p);
    });
  const configStore = useConfigStore();
  configStore.removeNodeConfig(name);
  g.remove();
  const canvasStore = useCanvasStore();
  canvasStore.canvasNodes.delete(name);
  checkPorts(d3g);
}

function createGroup(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  d3sel: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: DataType
) {
  return d3g
    .append('g')
    .datum(data)
    .classed('node', true)
    .attr('data-id', data.name)
    .attr('data-package', data.package)
    .attr('transform', 'translate(' + data.x + ',' + data.y + ')')
    .on('move', function (this, e: d3.CustomEventParameters) {
      d3g.select('.commands').attr('visibility', 'hidden');
      handleGroupDrag.call(this, e.detail);
    })
    .call(
      d3
        .drag<SVGGElement, DataType>()
        .on('start', function (this) {
          selectNode(this, d3g, false);
          d3sel.attr('display', 'none');
          d3g.select('.commands').attr('visibility', 'hidden');
        })
        .on(
          'drag',
          function (
            this,
            e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, DataType>
          ) {
            d3.select(this).dispatch('move', {
              bubbles: false,
              cancelable: false,
              detail: e,
            });
          }
        )
        .on(
          'end',
          function (
            this,
            e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, DataType>
          ) {
            d3.select(this).classed('hovered', false);
            const bbox = d3.select(this).node().getBBox();
            d3sel
              .attr(
                'transform',
                `translate(${
                  e.subject.x + bbox.x - D3_CONSTS.SELECTION_OFFSET
                },${e.subject.y + bbox.y - D3_CONSTS.SELECTION_OFFSET})`
              )
              .attr('display', null)
              .select('.sel-rect')
              .attr('width', bbox.width + D3_CONSTS.SELECTION_OFFSET * 2)
              .attr('height', bbox.height + D3_CONSTS.SELECTION_OFFSET * 2);
            const coords = extractTranslateCoords(d3sel.attr('transform'));
            d3g
              .select<SVGGElement>('.commands')
              .attr('visibility', null)
              .attr('transform', function (this) {
                return `translate(${
                  coords.x +
                  d3sel.node().getBBox().width / 2 -
                  this.getBBox().width / 2
                },${coords.y - this.getBBox().height - D3_CONSTS.SELECTION_OFFSET})`;
              });
          }
        ) as never
    )
    .on('click', function (this, e: PointerEvent, d) {
      if (e.ctrlKey) {
        toggleNode(this, d);
      }
    })
    .on('dblclick', function (this, e: PointerEvent) {
      const portDoubleClicked = d3
        .select(this)
        .selectAll<SVGCircleElement, unknown>('circle')
        .nodes()
        .find((c) => portContainsPoint(c, e));
      if (portDoubleClicked != null) {
        const fromOrTo =
          portDoubleClicked.dataset['io'] == 'input' ? 'to' : 'from';
        d3.selectAll<SVGPathElement, unknown>(
          `path[data-${fromOrTo}-parent=${portDoubleClicked.dataset['parent']}][data-${fromOrTo}-port=${portDoubleClicked.dataset['name']}]`
        )
          .nodes()
          .forEach((p) => deleteEdge(p));
        checkPorts(d3g);
      } else {
        const canvasStore = useCanvasStore();
        canvasStore.doubleClick = true;
      }
    })
    .on('mouseover', function (this, _, d) {
      if (!d.selected) {
        d3.select(this).classed('hovered', true);
      }
    })
    .on('mouseout', function (this) {
      d3.select(this).classed('hovered', false);
    });
}

function createBackgroundRect(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  d3g: d3.Selection<Element, unknown, null, undefined>,
  inputs: Map<string, string>,
  outputs: Map<string, string>
) {
  return selection
    .insert('rect')
    .attr('width', function (this, data) {
      const titleSize = calculateTextLength(
        d3g,
        data.name,
        D3_CONSTS.TITLE_FONT_SIZE
      );
      const maxInputSize =
        d3.max(
          [...inputs.keys()].map((d) =>
            calculateTextLength(d3g, d, D3_CONSTS.FONT_SIZE)
          )
        ) || 0;
      const maxOutputSize =
        d3.max(
          [...outputs.keys()].map((d) =>
            calculateTextLength(d3g, d, D3_CONSTS.FONT_SIZE)
          )
        ) || 0;
      const totalSize = maxInputSize + maxOutputSize + 36;
      const separatorSize = maxInputSize == 0 || maxOutputSize == 0 ? 0 : 50;
      return titleSize > totalSize + separatorSize
        ? titleSize
        : totalSize + separatorSize;
    })
    .attr('height', (Math.max(inputs.size, outputs.size) + 1) * 36)
    .attr('x', function (this) {
      return -this.getAttribute('width') / 2;
    })
    .attr('y', function (this) {
      return -this.getAttribute('height') / 2;
    })
    .attr('rx', D3_CONSTS.RECT_RADIUS)
    .attr('ry', D3_CONSTS.RECT_RADIUS)
    .attr('fill', '#f5f5f5')
    .attr('stroke', 'black')
    .attr('stroke-width', 2);
}

function createTitleRect(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  backgroundRect: d3.Selection<SVGRectElement, DataType, null, undefined>
) {
  const titleRect = selection
    .insert('rect')
    .attr('width', backgroundRect.attr('width'))
    .attr('height', 36)
    .attr('x', function (this) {
      return -this.getAttribute('width') / 2;
    })
    .attr('y', backgroundRect.attr('y'))
    .attr('rx', D3_CONSTS.RECT_RADIUS)
    .attr('ry', D3_CONSTS.RECT_RADIUS)
    .attr('fill', '#ff8038')
    .attr('stroke', 'black')
    .attr('stroke-width', 2);
  return titleRect;
}

function createTitle(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  backgroundRect: d3.Selection<SVGRectElement, DataType, null, undefined>,
  titleRect: d3.Selection<SVGRectElement, DataType, null, undefined>
) {
  selection
    .insert('text')
    .text((data) => data.name)
    .attr('y', +backgroundRect.attr('y') + +titleRect.attr('height') / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', 'black')
    .attr('font-size', D3_CONSTS.TITLE_FONT_SIZE);
}

function createPorts(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  backgroundRect: d3.Selection<SVGRectElement, DataType, null, undefined>,
  d3g: d3.Selection<Element, unknown, null, undefined>,
  inputs: Map<string, string>,
  outputs: Map<string, string>
) {
  let from: { x: number; y: number } = null;
  let compatiblePorts: d3.Selection<
    SVGCircleElement,
    unknown,
    HTMLElement,
    unknown
  > = null;
  selection
    .selectAll('circle')
    .data([...inputs, ...outputs])
    .enter()
    .insert('circle')
    .attr('data-parent', selection.datum().name)
    .attr('data-name', (d) => d[0])
    .attr('data-type', (d) => d[1])
    .attr('data-io', (_, i) => (i < inputs.size ? 'input' : 'output'))
    .attr('cx', (_, i) => {
      const x = +backgroundRect.attr('width') / 2;
      return i < inputs.size ? -x : x;
    })
    .attr(
      'cy',
      (_, i) =>
        +backgroundRect.attr('y') +
        18 +
        (i < inputs.size ? i + 1 : i + 1 - inputs.size) * 36
    )
    .attr('r', D3_CONSTS.PORT_RADIUS)
    .attr('fill', 'gray')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .call(
      d3
        .drag<SVGCircleElement, unknown>()
        .on('start', function (this) {
          d3.select(this).classed('compatible', true);
          d3.select(this.parentElement).classed('hovered', false);
          selectNode(this.parentElement, d3g, false);
          d3g
            .append('path')
            .attr('data-type', 'current')
            .attr('stroke', 'black')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .lower();
          from = {
            x: +this.getAttribute('cx'),
            y: +this.getAttribute('cy'),
          };
          compatiblePorts = d3.selectAll(
            'circle[data-io=' +
              (this.dataset['io'] == 'input' ? 'output' : 'input') +
              '][data-parent]:not([data-parent=' +
              this.dataset['parent'] +
              '])'
          );
          if (this.dataset['type'] == 'custom') {
            compatiblePorts.classed('compatible', true);
          } else {
            compatiblePorts = compatiblePorts
              .filter(
                '[data-type=' + this.dataset['type'] + '],[data-type=custom]'
              )
              .classed('compatible', true);
          }
        })
        .on('drag', (e) => {
          d3.select('path[data-type=current]').attr(
            'd',
            calculatePath({
              xFrom: selection.datum().x + from.x,
              yFrom: selection.datum().y + from.y,
              xTo: selection.datum().x + e.x,
              yTo: selection.datum().y + e.y,
            })
          );
        })
        .on('end', function (this, e) {
          const hoveredPorts = compatiblePorts
            .nodes()
            .filter((c) => portContainsPoint(c, e));
          if (hoveredPorts.length > 0) {
            const topMostPort = hoveredPorts[hoveredPorts.length - 1];
            const inputPort =
              this.dataset['io'] == 'input' ? this : topMostPort;
            const outputPort =
              this.dataset['io'] == 'output' ? this : topMostPort;
            d3.selectAll<SVGPathElement, unknown>(
              `path[data-to-parent=${inputPort.dataset['parent']}][data-to-port=${inputPort.dataset['name']}]`
            )
              .nodes()
              .forEach((p) => deleteEdge(p));
            createEdge(d3g, {
              fromNode: outputPort.dataset['parent'],
              fromPort: outputPort.dataset['name'],
              toNode: inputPort.dataset['parent'],
              toPort: inputPort.dataset['name'],
            });
            checkPorts(d3g);
          }
          from = null;
          d3.select('path[data-type=current]').remove();
          d3.selectAll('circle').classed('compatible', false);
        }) as never
    );
}

function createTexts(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  backgroundRect: d3.Selection<SVGRectElement, DataType, null, undefined>,
  inputs: Map<string, string>,
  outputs: Map<string, string>
) {
  selection
    .selectAll('text[type=param]')
    .data([...inputs, ...outputs])
    .enter()
    .insert('text')
    .text((d) => d[0])
    .attr('type', 'param')
    .attr('text-anchor', (_, i) => (i < inputs.size ? 'start' : 'end'))
    .attr('dominant-baseline', 'central')
    .attr('fill', 'black')
    .attr('font-size', D3_CONSTS.FONT_SIZE)
    .attr('x', (_, i) => {
      const x = +backgroundRect.attr('width') / 2;
      return i < inputs.size ? -x + 18 : x - 18;
    })
    .attr(
      'y',
      (_, i) =>
        +backgroundRect.attr('y') +
        18 +
        (i < inputs.size ? i + 1 : i + 1 - inputs.size) * 36
    );
}

function createSeparator(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  backgroundRect: d3.Selection<SVGRectElement, DataType, null, undefined>,
  d3g: d3.Selection<Element, unknown, null, undefined>,
  inputs: Map<string, string>,
  outputs: Map<string, string>
) {
  if (inputs.size == 0 || outputs.size == 0) {
    return;
  }
  const start = -backgroundRect.attr('width') / 2 + 18;
  const maxInputSize = d3.max(
    [...inputs.keys()].map((d) =>
      calculateTextLength(d3g, d, D3_CONSTS.FONT_SIZE)
    )
  );
  const end = +backgroundRect.attr('width') / 2 - 18;
  const maxOutputSize = d3.max(
    [...outputs.keys()].map((d) =>
      calculateTextLength(d3g, d, D3_CONSTS.FONT_SIZE)
    )
  );
  const x = (start + maxInputSize + end - maxOutputSize) / 2;
  selection
    .insert('line')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('x1', x)
    .attr('y1', +backgroundRect.attr('y') + 36)
    .attr('x2', x)
    .attr('y2', +backgroundRect.attr('y') + +backgroundRect.attr('height'));
}

export function createCommands(
  d3com: d3.Selection<SVGGElement, unknown, null, undefined>
) {
  const data = [
    [
      'copy',
      'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    ],
    [
      'edit',
      'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    ],
    [
      'delete',
      'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    ],
  ];

  const commands = d3com
    .selectAll('svg')
    .data(data)
    .enter()
    .append('svg')
    .classed('command', true)
    .attr('height', D3_CONSTS.COMMAND_SIZE)
    .attr('width', D3_CONSTS.COMMAND_SIZE)
    .attr('viewBox', '0 0 24 24')
    .attr(
      'x',
      (_, i) => i * (D3_CONSTS.COMMAND_SIZE + D3_CONSTS.COMMAND_OFFSET)
    )
    .attr('y', 0)
    .each(function (this, d) {
      d3.select(this).classed(d[0], true);
    });

  commands.insert('path').attr('d', 'M0 0h24v24H0z').attr('fill-opacity', 0);
  commands.append('path').attr('d', (d) => d[1]);

  d3com
    .select('rect')
    .attr('rx', D3_CONSTS.RECT_RADIUS)
    .attr('ry', D3_CONSTS.RECT_RADIUS)
    .attr(
      'width',
      D3_CONSTS.COMMAND_SIZE * data.length +
        D3_CONSTS.COMMAND_OFFSET * (data.length - 1)
    )
    .attr('height', D3_CONSTS.COMMAND_SIZE)
    .lower();
}
