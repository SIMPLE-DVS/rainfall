import { calculatePath, calculateTextLength } from '../d3/utils';
import { D3_CONSTS, DataType, PathElements } from '../d3/types';
import { useCanvasStore } from 'src/stores/canvasStore';

export function createExecutionNode(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  n: DataType
) {
  const node = d3g
    .append('g')
    .classed('node', true)
    .attr('data-id', n.name)
    .attr('transform', 'translate(' + n.x + ',' + n.y + ')');

  const backgroundRect = node
    .insert('rect')
    .attr('width', calculateTextLength(d3g, n.name, D3_CONSTS.TITLE_FONT_SIZE))
    .attr('height', 36)
    .attr('x', function (this) {
      return -this.getAttribute('width') / 2;
    })
    .attr('y', function (this) {
      return -this.getAttribute('height') / 2;
    })
    .attr('rx', D3_CONSTS.RECT_RADIUS)
    .attr('ry', D3_CONSTS.RECT_RADIUS)
    .attr('fill', '#ff8038')
    .attr('stroke', 'black')
    .attr('stroke-width', 2);
  node
    .insert('text')
    .text(n.name)
    .attr('y', +backgroundRect.attr('y') + +backgroundRect.attr('height') / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', 'black')
    .attr('font-size', D3_CONSTS.TITLE_FONT_SIZE);
}

export function createExecutionEdge(
  d3g: d3.Selection<Element, unknown, null, undefined>,
  e: PathElements
) {
  const canvasStore = useCanvasStore();

  d3g
    .append('path')
    .classed('edge', true)
    .attr('stroke', 'black')
    .attr('stroke-width', 3)
    .attr('fill', 'none')
    .attr('d', () => {
      const from = canvasStore.canvasNodes.get(e.fromNode);
      const to = canvasStore.canvasNodes.get(e.toNode);
      return calculatePath({
        xFrom:
          from.x +
          +d3g
            .select<SVGGElement>('.node[data-id=' + from.name + ']')
            .node()
            .getBBox().width /
            2,
        yFrom: from.y,
        xTo:
          to.x -
          +d3g
            .select<SVGGElement>('.node[data-id=' + to.name + ']')
            .node()
            .getBBox().width /
            2,
        yTo: to.y,
      });
    })
    .lower();
}
