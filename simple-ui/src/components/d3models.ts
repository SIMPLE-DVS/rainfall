import * as d3 from 'd3';
import { debounce } from 'quasar';
import { useCanvasStore } from 'src/stores/canvasStore';

export interface DataType {
  name: string;
  package: string;
  x: number;
  y: number;
  inputs: Map<string, string>;
  outputs: Map<string, string>;
}

interface GenericCoords {
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
  const fromParentId = path.getAttribute('data-from-parent');
  const fromPortName = path.getAttribute('data-from-port');
  const fromParent = d3.select('g[data-id=' + fromParentId + ']');
  const fromPort = d3.select(
    'circle[data-parent=' + fromParentId + '][data-name=' + fromPortName + ']'
  );
  const fromParentCoords = extractTranslateCoords(fromParent.attr('transform'));

  const toParentId = path.getAttribute('data-to-parent');
  const toPortName = path.getAttribute('data-to-port');
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

export function selectNode(g: Element) {
  d3.selectAll('g').classed('selected', false);
  d3.select(g).classed('selected', true);
  d3.select(g).raise();
  const canvasStore = useCanvasStore();
  canvasStore.selectedNode = {
    name: g.getAttribute('data-id'),
    package: g.getAttribute('data-package'),
  };
}

export function clearSelection() {
  d3.selectAll('g').classed('selected', false);
  const canvasStore = useCanvasStore();
  canvasStore.selectedNode = null;
}

const radius = 12;
const fontSize = '20px';
const titleFontSize = '32px';

export function createNode(
  d3elem: Element,
  d3g: d3.Selection<d3.BaseType, unknown, null, undefined>,
  data: DataType
) {
  const selection = createGroup(d3elem, d3g, data);
  const backgroundRect = createBackgroundRect(selection, d3g);
  const titleRect = createTitleRect(selection, backgroundRect);
  createTitle(selection, backgroundRect, titleRect);
  createPorts(selection, backgroundRect, d3g);
  createTexts(selection, backgroundRect);
  createSeparator(selection, backgroundRect, d3g);
  return selection;
}

function handleDrag(
  this: Element,
  e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, DataType>,
  d3elem: Element
) {
  if (this != d3elem) {
    d3.select(this).attr(
      'transform',
      'translate(' + (e.subject.x += e.dx) + ',' + (e.subject.y += e.dy) + ')'
    );
    debounce(() => {
      d3.selectAll(
        'path[data-from-parent=' +
          this.getAttribute('data-id') +
          '],path[data-to-parent=' +
          this.getAttribute('data-id') +
          ']'
      ).attr('d', function (this) {
        const coords = extractPathCoords(this as SVGPathElement);
        return calculatePath(coords);
      });
    }, 10)();
  }
}

function calculateTextLength(
  d3g: d3.Selection<d3.BaseType, unknown, null, undefined>,
  text: string,
  fontSize: string
) {
  const node = d3g.append('text').attr('font-size', fontSize).text(text).node();
  const length = node.getComputedTextLength();
  node.remove();
  return length;
}

function extractTranslateCoords(transform: string): GenericCoords {
  const regex = /translate\((?<x>.+?)[, ]+(?<y>.+?)\)/gim;
  const res = regex.exec(transform);
  return { x: +res[1], y: +res[2] };
}

function createGroup(
  d3elem: Element,
  d3g: d3.Selection<d3.BaseType, unknown, null, undefined>,
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
        .drag()
        .on('start', function (this: d3.BaseType) {
          selectNode(this as SVGGElement);
        })
        .on(
          'drag',
          function (
            this: Element,
            e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, DataType>
          ) {
            handleDrag.call(this, e, d3elem);
          }
        )
        .on('end', function (this: Element) {
          d3.select(this).classed('hovered', false);
        }) as never
    )
    .on('dblclick', () => {
      const canvasStore = useCanvasStore();
      canvasStore.doubleClick = true;
    })
    .on('mouseover', function (this: d3.BaseType) {
      if (!d3.select(this).classed('selected')) {
        d3.select(this).classed('hovered', true);
      }
    })
    .on('mouseout', function (this: d3.BaseType) {
      d3.select(this).classed('hovered', false);
    });
}

function createBackgroundRect(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  d3g: d3.Selection<d3.BaseType, unknown, null, undefined>
) {
  return selection
    .insert('rect')
    .attr('width', function (this, data) {
      const titleSize = calculateTextLength(d3g, data.name, titleFontSize);
      const maxInputSize =
        d3.max(
          [...data.inputs.keys()].map((d) =>
            calculateTextLength(d3g, d, fontSize)
          )
        ) || 0;
      const maxOutputSize =
        d3.max(
          [...data.outputs.keys()].map((d) =>
            calculateTextLength(d3g, d, fontSize)
          )
        ) || 0;
      const totalSize = maxInputSize + maxOutputSize + 36;
      const separatorSize = maxInputSize == 0 || maxOutputSize == 0 ? 0 : 50;
      return titleSize > totalSize + separatorSize
        ? titleSize
        : totalSize + separatorSize;
    })
    .attr(
      'height',
      (data) => (Math.max(data.inputs.size, data.outputs.size) + 1) * 36
    )
    .attr('x', function (this) {
      return -this.getAttribute('width') / 2;
    })
    .attr('y', function (this) {
      return -this.getAttribute('height') / 2;
    })
    .attr('rx', 10)
    .attr('ry', 10)
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
    .attr('rx', 10)
    .attr('ry', 10)
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
  return selection
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
  d3g: d3.Selection<d3.BaseType, unknown, null, undefined>
) {
  let from: { x: number; y: number } = null;
  let compatiblePorts: d3.Selection<
    d3.BaseType,
    unknown,
    HTMLElement,
    unknown
  > = null;
  return selection.each(function (this, data) {
    d3.select(this)
      .selectAll('circle')
      .data([...data.inputs, ...data.outputs])
      .enter()
      .insert('circle')
      .attr('data-parent', data.name)
      .attr('data-name', (d) => d[0])
      .attr('data-type', (d) => d[1])
      .attr('data-io', (_, i) => (i < data.inputs.size ? 'input' : 'output'))
      .attr('cx', (_, i) => {
        const x = +backgroundRect.attr('width') / 2;
        return i < data.inputs.size ? -x : x;
      })
      .attr(
        'cy',
        (_, i) =>
          +backgroundRect.attr('y') +
          18 +
          (i < data.inputs.size ? i + 1 : i + 1 - data.inputs.size) * 36
      )
      .attr('r', radius)
      .attr('fill', 'gray')
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .call(
        d3
          .drag()
          .on('start', function (this) {
            d3.select(this.parentElement).classed('hovered', false);
            selectNode(this.parentElement);
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
                (this.getAttribute('data-io') == 'input' ? 'output' : 'input') +
                '][data-parent]:not([data-parent=' +
                this.getAttribute('data-parent') +
                '])'
            );
            if (this.getAttribute('data-type') == 'custom') {
              compatiblePorts.classed('compatible', true);
            } else {
              compatiblePorts = compatiblePorts
                .filter(
                  '[data-type=' +
                    this.getAttribute('data-type') +
                    '],[data-type=custom]'
                )
                .classed('compatible', true);
            }
          })
          .on('drag', (e) => {
            d3.select('path[data-type=current]').attr(
              'd',
              calculatePath({
                xFrom: data.x + from.x,
                yFrom: data.y + from.y,
                xTo: data.x + e.x,
                yTo: data.y + e.y,
              })
            );
          })
          .on('end', function (this, e) {
            const hoveredPorts = compatiblePorts.nodes().filter((c) => {
              return (
                Math.pow(
                  +(c as SVGCircleElement).getAttribute('cx') -
                    d3.pointer(e, c)[0],
                  2
                ) +
                  Math.pow(
                    +(c as SVGCircleElement).getAttribute('cy') -
                      d3.pointer(e, c)[1],
                    2
                  ) <=
                radius * radius
              );
            });
            if (hoveredPorts.length > 0) {
              const topMostPort = hoveredPorts[
                hoveredPorts.length - 1
              ] as SVGCircleElement;
              const coords = extractTranslateCoords(
                topMostPort.parentElement.getAttribute('transform')
              );
              d3g
                .append('path')
                .attr(
                  'data-from-parent',
                  this.getAttribute('data-io') == 'input'
                    ? topMostPort.getAttribute('data-parent')
                    : this.getAttribute('data-parent')
                )
                .attr(
                  'data-from-port',
                  this.getAttribute('data-io') == 'input'
                    ? topMostPort.getAttribute('data-name')
                    : this.getAttribute('data-name')
                )
                .attr(
                  'data-to-parent',
                  this.getAttribute('data-io') == 'input'
                    ? this.getAttribute('data-parent')
                    : topMostPort.getAttribute('data-parent')
                )
                .attr(
                  'data-to-port',
                  this.getAttribute('data-io') == 'input'
                    ? this.getAttribute('data-name')
                    : topMostPort.getAttribute('data-name')
                )
                .attr('stroke', 'black')
                .attr('stroke-width', 3)
                .attr('fill', 'none')
                .attr('d', () => {
                  return calculatePath({
                    xFrom: data.x + +this.getAttribute('cx'),
                    yFrom: data.y + +this.getAttribute('cy'),
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
  });
}

function createTexts(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  backgroundRect: d3.Selection<SVGRectElement, DataType, null, undefined>
) {
  return selection.each(function (this, data) {
    d3.select(this)
      .selectAll('text[type=param')
      .data([...data.inputs, ...data.outputs])
      .enter()
      .insert('text')
      .text((d) => d[0])
      .attr('type', 'param')
      .attr('text-anchor', (_, i) => (i < data.inputs.size ? 'start' : 'end'))
      .attr('dominant-baseline', 'central')
      .attr('fill', 'black')
      .attr('font-size', fontSize)
      .attr('x', (_, i) => {
        const x = +backgroundRect.attr('width') / 2;
        return i < data.inputs.size ? -x + 18 : x - 18;
      })
      .attr(
        'y',
        (_, i) =>
          +backgroundRect.attr('y') +
          18 +
          (i < data.inputs.size ? i + 1 : i + 1 - data.inputs.size) * 36
      );
  });
}

function createSeparator(
  selection: d3.Selection<SVGGElement, DataType, null, undefined>,
  backgroundRect: d3.Selection<SVGRectElement, DataType, null, undefined>,
  d3g: d3.Selection<d3.BaseType, unknown, null, undefined>
) {
  return selection.each(function (this, data) {
    if (data.inputs.size == 0 || data.outputs.size == 0) {
      return;
    }
    const start = -backgroundRect.attr('width') / 2 + 18;
    const maxInputSize = d3.max(
      [...data.inputs.keys()].map((d) => calculateTextLength(d3g, d, fontSize))
    );
    const end = +backgroundRect.attr('width') / 2 - 18;
    const maxOutputSize = d3.max(
      [...data.outputs.keys()].map((d) => calculateTextLength(d3g, d, fontSize))
    );
    const x = (start + maxInputSize + end - maxOutputSize) / 2;
    d3.select(this)
      .insert('line')
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('x1', x)
      .attr('y1', +backgroundRect.attr('y') + 36)
      .attr('x2', x)
      .attr('y2', +backgroundRect.attr('y') + +backgroundRect.attr('height'));
  });
}
