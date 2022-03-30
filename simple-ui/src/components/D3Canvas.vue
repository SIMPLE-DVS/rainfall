<template>
  <div
    style="
      position: absolute;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      border: 0;
    "
    class="fill-height fill-width"
  >
    <svg
      class="mindmap-svg fill-height fill-width"
      style="
        position: absolute;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        border: 0;
      "
    >
      <g></g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import * as d3 from 'd3';

export default defineComponent({
  name: 'D3Canvas',

  setup() {
    onMounted(() => {
      interface DataType {
        id: number;
        x: number;
        y: number;
        i: string[];
        o: string[];
        path?: d3.Path;
      }
      const data: DataType[] = [];
      const numPoints = 11;
      const radius = 12;
      let from: { x: number; y: number } = null;

      function handleZoom(
        this: Element,
        e: d3.D3ZoomEvent<d3.ZoomedElementBaseType, unknown>
      ) {
        if (this == document.getElementsByClassName('mindmap-svg')[0]) {
          d3.select('svg g').attr('transform', e.transform.toString());
        }
      }

      function handleDrag(
        this: Element,
        e: d3.D3DragEvent<d3.DraggedElementBaseType, unknown, DataType>
      ) {
        if (
          this != document.getElementsByClassName('mindmap-svg')[0] &&
          (e.sourceEvent.target as SVGElement).nodeName != 'circle'
        ) {
          d3.select(this).attr(
            'transform',
            'translate(' +
              (e.subject.x += e.dx) +
              ',' +
              (e.subject.y += e.dy) +
              ')'
          );
          if (e.subject.path) {
            if (e.subject.id == 0 || e.subject.id == numPoints - 1) {
              updatePath();
            }
          }
        }
      }

      function generateCircles() {
        for (let i = 0; i < numPoints; i++) {
          data.push({
            id: i,
            x: Math.random() * 1000,
            y: Math.random() * 700,
            i: d3.range(Math.floor(Math.random() * 4)).map(() =>
              Math.random()
                .toString(36)
                .replace(/[^a-z]+/g, '')
                .substr(0, 1 + Math.floor(Math.random() * 5))
            ),
            o: d3.range(Math.floor(Math.random() * 4)).map(() =>
              Math.random()
                .toString(36)
                .replace(/[^a-z]+/g, '')
                .substr(0, 1 + Math.floor(Math.random() * 5))
            ),
          });
          console.log(data[i]);
        }
      }

      function calculatePath(x1: number, y1: number, x2: number, y2: number) {
        const path = d3.path();
        path.moveTo(x1, y1);
        path.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
        return path.toString();
      }

      function drawCircles() {
        const enterSelection = d3
          .select('svg g')
          .selectAll('g')
          .data(data)
          .join('g')
          .attr('id', (d) => d.id)
          .attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')')
          .call(d3.drag().on('drag', handleDrag) as never)
          .on('mouseover', function (this: d3.BaseType) {
            d3.select(this).raise();
            d3.select(this).classed('active', true);
          })
          .on('mouseout', function (this: d3.BaseType) {
            d3.select(this).classed('active', false);
          });
        enterSelection
          .append('text')
          .text((d) => d.id)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', 'black')
          .attr('font-size', '32px');
        enterSelection
          .insert('rect')
          .attr('type', 'background')
          .attr('width', function (this, d) {
            const titleSize = d3
              .select(this)
              .node()
              .parentNode.querySelector('text')
              .getBBox().width;

            const maxInputSize =
              d3.max(
                d.i.map((d) => {
                  const node = d3
                    .select('svg g')
                    .append('text')
                    .attr('font-size', '20px')
                    .text(d)
                    .node();
                  const length = node.getComputedTextLength();
                  node.remove();
                  return length;
                })
              ) || 0;
            const maxOutputSize =
              d3.max(
                d.o.map((d) => {
                  const node = d3
                    .select('svg g')
                    .append('text')
                    .attr('font-size', '20px')
                    .text(d)
                    .node();
                  const length = node.getComputedTextLength();
                  node.remove();
                  return length;
                })
              ) || 0;
            const totalSize = maxInputSize + maxOutputSize + 36;
            const separatorSize =
              maxInputSize == 0 || maxOutputSize == 0 ? 0 : 50;
            return titleSize > totalSize
              ? titleSize
              : totalSize + separatorSize;
          })
          .attr('height', (d) => (Math.max(d.i.length, d.o.length) + 1) * 36)
          .attr('x', function (this) {
            return -this.getAttribute('width') / 2;
          })
          .attr('y', function (this) {
            return -36 / 2;
          })
          .attr('rx', 10)
          .attr('ry', 10)
          .attr('fill', '#f5f5f5')
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .lower();
        enterSelection
          .insert('rect')
          .attr('type', 'title')
          .attr('width', function (this) {
            return d3
              .select(this)
              .node()
              .parentNode.querySelector('rect[type=background]')
              .getAttribute('width');
          })
          .attr('height', 36)
          .attr('x', function (this) {
            return -this.getAttribute('width') / 2;
          })
          .attr('y', function (this) {
            return -this.getAttribute('height') / 2;
          })
          .attr('rx', 10)
          .attr('ry', 10)
          .attr('fill', '#ff8038')
          .attr('stroke', 'black')
          .attr('stroke-width', 2);
        enterSelection.each(function (this, d, i) {
          d3.select(this)
            .selectAll('circle')
            .data(d.i.concat(d.o))
            .enter()
            .insert('circle')
            .attr('type', (_, i) => (i < d.i.length ? 'input' : 'output'))
            .attr('cx', function (this, _, i) {
              const x =
                +d3
                  .select(this)
                  .node()
                  .parentNode.querySelector('rect[type=background]')
                  .getAttribute('width') / 2;
              return i < d.i.length ? -x : x;
            })
            .attr(
              'cy',
              (_, i) => (i < d.i.length ? i + 1 : i + 1 - d.i.length) * 36
            )
            .attr('r', radius)
            .attr('fill', 'gray')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .call(
              d3
                .drag()
                .on('start', function (this) {
                  d3.select('svg g')
                    .append('path')
                    .attr('type', 'current')
                    .attr('stroke', 'green')
                    .attr('stroke-width', 3)
                    .attr('fill', 'none')
                    .lower();
                  from = {
                    x: +this.getAttribute('cx'),
                    y: +this.getAttribute('cy'),
                  };
                  d3.selectAll('circle').classed('compatible', true);
                })
                .on('drag', (e) => {
                  d3.select('path[type=current]').attr(
                    'd',
                    calculatePath(
                      data[i].x + from.x,
                      data[i].y + from.y,
                      data[i].x + e.x,
                      data[i].y + e.y
                    )
                  );
                })
                .on('end', function (this, e) {
                  const compatibleCircles = d3
                    .selectAll('circle')
                    .nodes()
                    .filter((c) => {
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
                  if (compatibleCircles.length > 0) {
                    const topMostCircle = compatibleCircles[
                      compatibleCircles.length - 1
                    ] as SVGCircleElement;
                    d3.select('svg g')
                      .append('path')
                      .attr('stroke', 'green')
                      .attr('stroke-width', 3)
                      .attr('fill', 'none')
                      .attr(
                        'd',
                        calculatePath(
                          d.x + +this.getAttribute('cx'),
                          d.y + +this.getAttribute('cy'),
                          data[+topMostCircle.parentElement.getAttribute('id')]
                            .x + +topMostCircle.getAttribute('cx'),
                          data[+topMostCircle.parentElement.getAttribute('id')]
                            .y + +topMostCircle.getAttribute('cy')
                        )
                      )
                      .lower();
                    d3.select(this).classed('connected', true);
                    d3.select(topMostCircle).classed('connected', true);
                  }
                  from = null;
                  d3.select('path[type=current]').remove();
                  d3.selectAll('circle').classed('compatible', false);
                }) as never
            );
        });
        enterSelection.each(function (this, d) {
          d3.select(this)
            .selectAll('text[type=param]')
            .data(d.i.concat(d.o))
            .enter()
            .insert('text')
            .text((d) => d)
            .attr('type', 'param')
            .attr('text-anchor', (_, i) => (i < d.i.length ? 'start' : 'end'))
            .attr('dominant-baseline', 'central')
            .attr('fill', 'black')
            .attr('font-size', '20px')
            .attr('x', function (this, _, i) {
              const x =
                +d3
                  .select(this)
                  .node()
                  .parentNode.querySelector('rect[type=background]')
                  .getAttribute('width') / 2;
              return i < d.i.length ? -x + 18 : x - 18;
            })
            .attr(
              'y',
              (_, i) => (i < d.i.length ? i + 1 : i + 1 - d.i.length) * 36
            );
        });
        enterSelection.each(function (this, d) {
          if (d.i.length == 0 || d.o.length == 0) {
            return;
          }
          const start =
            -(d3.select(this).node() as SVGGElement)
              .querySelector('rect[type=background]')
              .getAttribute('width') /
              2 +
            18;
          const maxInputSize = d3.max(
            d.i.map((d) => {
              const node = d3
                .select('svg g')
                .append('text')
                .attr('font-size', '20px')
                .text(d)
                .node();
              const length = node.getComputedTextLength();
              node.remove();
              return length;
            })
          );
          const end =
            +(d3.select(this).node() as SVGGElement)
              .querySelector('rect[type=background]')
              .getAttribute('width') /
              2 -
            18;
          const maxOutputSize = d3.max(
            d.o.map((d) => {
              const node = d3
                .select('svg g')
                .append('text')
                .attr('font-size', '20px')
                .text(d)
                .node();
              const length = node.getComputedTextLength();
              node.remove();
              return length;
            })
          );
          d3.select(this)
            .selectAll('line')
            .data([1])
            .enter()
            .insert('line')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('x1', () => {
              return (start + maxInputSize + end - maxOutputSize) / 2;
            })
            .attr('y1', 18)
            .attr('x2', () => {
              return (start + maxInputSize + end - maxOutputSize) / 2;
            })
            .attr('y2', () => {
              return (
                +(d3.select(this).node() as SVGGElement)
                  .querySelector('rect[type=background]')
                  .getAttribute('height') - 18
              );
            });
        });

        d3.select('svg g').selectAll('text').raise();
      }

      function getPath() {
        const path = d3.path();
        const circle1 = data[0];
        const circle2 = data[numPoints - 1];
        const x1 = circle1.x;
        const y1 = circle1.y;
        const x2 = circle2.x;
        const y2 = circle2.y;
        path.moveTo(x1, y1);
        path.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
        return path;
      }

      function generateAndDrawPath() {
        const path = getPath();
        data[0].path = path;
        data[numPoints - 1].path = path;
        d3.select('svg g')
          .append('path')
          .attr('stroke', 'green')
          .attr('stroke-width', 3)
          .attr('fill', 'none')
          .attr('d', path.toString());
      }

      function updatePath() {
        d3.select('path').attr('d', getPath().toString());
      }

      d3.select('svg')
        .call(d3.zoom().on('zoom', handleZoom) as never)
        .on('dblclick.zoom', null);

      generateCircles();
      drawCircles();

      generateAndDrawPath();
    });

    return {};
  },
});
</script>

<style scoped>
svg :deep(.active) {
  outline: 3px solid #1976d2;
  outline-offset: 3px;
  outline-style: dashed;
}

svg :deep(.compatible) {
  fill: #e7ff53;
}

svg :deep(.connected) {
  fill: #5dff77;
}
</style>
