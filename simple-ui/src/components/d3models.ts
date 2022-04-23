import * as d3 from 'd3';
import { debounce } from 'quasar';
import { useCanvasStore } from 'src/stores/canvasStore';
import { useConfigStore } from 'src/stores/configStore';

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

interface PathCoords {
  xFrom: number;
  yFrom: number;
  xTo: number;
  yTo: number;
}

function calculatePath(coords: PathCoords) {
  const path = d3.path();
  path.moveTo(coords.xFrom, coords.yFrom);
  path.bezierCurveTo(
    (coords.xFrom + coords.xTo) / 2,
    coords.yFrom,
    (coords.xFrom + coords.xTo) / 2,
    coords.yTo,
    coords.xTo,
    coords.yTo
  );
  return path.toString();
}

function extractPathCoords(path: SVGPathElement): PathCoords {
  const fromParentId = path.dataset['fromParent'];
  const fromPortName = path.dataset['fromPort'];
  const fromParent = d3.select('g[data-id=' + fromParentId + ']');
  const fromPort = d3.select(
    'circle[data-parent=' + fromParentId + '][data-name=' + fromPortName + ']'
  );
  const fromParentCoords = extractTranslateCoords(fromParent.attr('transform'));

  const toParentId = path.dataset['toParent'];
  const toPortName = path.dataset['toPort'];
  const toParent = d3.select('g[data-id=' + toParentId + ']');
  const toPort = d3.select(
    'circle[data-parent=' + toParentId + '][data-name=' + toPortName + ']'
  );
  const toParentCoords = extractTranslateCoords(toParent.attr('transform'));

  return {
    xFrom: fromParentCoords.x + +fromPort.attr('cx'),
    yFrom: fromParentCoords.y + +fromPort.attr('cy'),
    xTo: toParentCoords.x + +toPort.attr('cx'),
    yTo: toParentCoords.y + +toPort.attr('cy'),
  };
}

export function selectNode(
  g: SVGGElement | HTMLElement,
  d3g: d3.Selection<Element, unknown, null, undefined>,
  addNode: boolean
) {
  const canvasStore = useCanvasStore();
  if (!addNode) {
    d3g.selectAll<SVGGElement, DataType>('g').each((d) => {
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

function toggleNode(g: SVGGElement, d: DataType) {
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
  d3g.selectAll<SVGGElement, DataType>('g').each((d) => {
    d.selected = false;
  });
  const canvasStore = useCanvasStore();
  canvasStore.selectedNodes = [];
}

function portContainsPoint(c: SVGCircleElement, e: Event) {
  return (
    Math.pow(+c.getAttribute('cx') - d3.pointer(e, c)[0], 2) +
      Math.pow(+c.getAttribute('cy') - d3.pointer(e, c)[1], 2) <=
    portRadius * portRadius
  );
}

function removeConnectedEdges(c: SVGCircleElement) {
  const fromOrTo = c.dataset['io'] == 'input' ? 'to' : 'from';
  d3.selectAll<SVGPathElement, unknown>(
    `path[data-${fromOrTo}-parent=${c.dataset['parent']}][data-${fromOrTo}-port=${c.dataset['name']}]`
  ).remove();
}

function checkPorts(d3g: d3.Selection<Element, unknown, null, undefined>) {
  d3g.selectAll<SVGCircleElement, unknown>('circle').each(function (this) {
    const fromOrTo = this.dataset['io'] == 'input' ? 'to' : 'from';
    const hasEdges = !d3
      .select<SVGPathElement, unknown>(
        `path[data-${fromOrTo}-parent=${this.dataset['parent']}][data-${fromOrTo}-port=${this.dataset['name']}]`
      )
      .empty();
    d3.select(this).classed('connected', hasEdges);
  });
}

const portRadius = 12;
const rectRadius = 10;
const selectionOffset = 5;
const fontSize = '20px';
const titleFontSize = '32px';

export function createNode(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  d3selRect: d3.Selection<SVGRectElement, unknown, null, undefined>,
  data: DataType
) {
  const configStore = useConfigStore();
  const nodeStructure = configStore.getNodeStructureByNodePackage(data.package);
  const inputs = new Map<string, string>(Object.entries(nodeStructure.input));
  const outputs = new Map<string, string>(Object.entries(nodeStructure.output));
  const selection = createGroup(d3g, d3selRect, data);
  const backgroundRect = createBackgroundRect(selection, d3g, inputs, outputs);
  const titleRect = createTitleRect(selection, backgroundRect);
  createTitle(selection, backgroundRect, titleRect);
  createPorts(selection, backgroundRect, d3g, inputs, outputs);
  createTexts(selection, backgroundRect, inputs, outputs);
  createSeparator(selection, backgroundRect, d3g, inputs, outputs);
  return selection;
}

export function handleGroupDrag(
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
      const coords = extractPathCoords(this);
      return calculatePath(coords);
    });
  }, 10)();
}

function calculateTextLength(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  text: string,
  fontSize: string
) {
  const node = d3g.append('text').attr('font-size', fontSize).text(text).node();
  const length = node.getComputedTextLength();
  node.remove();
  return length;
}

export function extractTranslateCoords(transform: string): GenericCoords {
  const regex = /translate\((?<x>.+?)[, ]+(?<y>.+?)\)/gim;
  const res = regex.exec(transform);
  return { x: +res[1], y: +res[2] };
}

function createGroup(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  d3selRect: d3.Selection<SVGRectElement, unknown, null, undefined>,
  data: DataType
) {
  return d3g
    .append('g')
    .datum(data)
    .attr('data-id', data.name)
    .attr('data-package', data.package)
    .attr('transform', 'translate(' + data.x + ',' + data.y + ')')
    .call(
      d3
        .drag<SVGGElement, DataType>()
        .on('start', function (this) {
          selectNode(this, d3g, false);
          d3selRect.attr('visibility', 'hidden');
        })
        .on(
          'drag',
          function (
            this,
            e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, DataType>
          ) {
            handleGroupDrag.call(this, e);
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
            d3selRect
              .attr('x', e.subject.x + bbox.x - selectionOffset)
              .attr('y', e.subject.y + bbox.y - selectionOffset)
              .attr('width', bbox.width + selectionOffset * 2)
              .attr('height', bbox.height + selectionOffset * 2);
            d3selRect.attr('visibility', null);
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
        removeConnectedEdges(portDoubleClicked);
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
      const titleSize = calculateTextLength(d3g, data.name, titleFontSize);
      const maxInputSize =
        d3.max(
          [...inputs.keys()].map((d) => calculateTextLength(d3g, d, fontSize))
        ) || 0;
      const maxOutputSize =
        d3.max(
          [...outputs.keys()].map((d) => calculateTextLength(d3g, d, fontSize))
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
    .attr('rx', rectRadius)
    .attr('ry', rectRadius)
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
    .attr('rx', rectRadius)
    .attr('ry', rectRadius)
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
    .attr('font-size', titleFontSize);
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
    .attr('r', portRadius)
    .attr('fill', 'gray')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .call(
      d3
        .drag<SVGCircleElement, unknown>()
        .on('start', function (this) {
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
            const coords = extractTranslateCoords(
              topMostPort.parentElement.getAttribute('transform')
            );
            const isInput = this.dataset['io'] == 'input';
            removeConnectedEdges(isInput ? this : topMostPort);
            checkPorts(d3g);
            d3g
              .append('path')
              .attr(
                'data-from-parent',
                isInput ? topMostPort.dataset['parent'] : this.dataset['parent']
              )
              .attr(
                'data-from-port',
                isInput ? topMostPort.dataset['name'] : this.dataset['name']
              )
              .attr(
                'data-to-parent',
                isInput ? this.dataset['parent'] : topMostPort.dataset['parent']
              )
              .attr(
                'data-to-port',
                isInput ? this.dataset['name'] : topMostPort.dataset['name']
              )
              .attr('stroke', 'black')
              .attr('stroke-width', 3)
              .attr('fill', 'none')
              .attr('d', () => {
                return calculatePath({
                  xFrom: selection.datum().x + +this.getAttribute('cx'),
                  yFrom: selection.datum().y + +this.getAttribute('cy'),
                  xTo: coords.x + +topMostPort.getAttribute('cx'),
                  yTo: coords.y + +topMostPort.getAttribute('cy'),
                });
              })
              .lower();
            d3.select(this).classed('connected', true);
            d3.select(topMostPort).classed('connected', true);
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
    .attr('font-size', fontSize)
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
    [...inputs.keys()].map((d) => calculateTextLength(d3g, d, fontSize))
  );
  const end = +backgroundRect.attr('width') / 2 - 18;
  const maxOutputSize = d3.max(
    [...outputs.keys()].map((d) => calculateTextLength(d3g, d, fontSize))
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
