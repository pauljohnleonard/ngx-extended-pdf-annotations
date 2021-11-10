// https://stackoverflow.com/questions/289779/calculating-a-boundary-around-several-linked-rectangles

import { AnnotationPageRect } from 'dist/ngx-extended-pdf-annotations/public-api';
import { AnnotationEdge } from './classes';

// Return the edges of the union of rects.
export function extractEdgesFromRects(inputRects: AnnotationPageRect[]) {
  // These extremes mean we don't get rects n the boundary
  let x = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
  let y = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];

  const borderX = 5;
  const borderY = 10;
  const rects = inputRects.map((rect) => {
    return {
      pos1: {
        x: rect.pos1.x - borderX,
        y: rect.pos1.y + borderY,
      },
      pos2: {
        x: rect.pos2.x + borderX,
        y: rect.pos2.y - borderY,
      },
    };
  });

  const compare = (a, b) => {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  };

  for (const rect of rects) {
    x.push(rect.pos1.x);
    x.push(rect.pos2.x);
    y.push(rect.pos1.y);
    y.push(rect.pos2.y);
  }

  x.sort(compare);
  y.sort(compare);
  x = trim(x);
  y = trim(y);

  const area: any[] = [];
  for (let i = 0; i < x.length - 1; i++) {
    area[i] = {};
  }

  for (const rect of rects) {
    paint(x, y, rect, area);
  }

  const indexEdges = extractIndexEdges(area, x.length - 1, y.length - 1);

  const edges: AnnotationEdge[] = [];

  for (const indexEdge of indexEdges) {
    edges.push({
      pos1: { x: x[indexEdge.x1], y: y[indexEdge.y1] },
      pos2: { x: x[indexEdge.x2], y: y[indexEdge.y2] },
    });
  }
  return edges;
}

// Remove duplicate entries
function trim(xArray: number[]) {
  const xtrim = [];

  let xLast = null;
  for (const x of xArray) {
    if (xLast === null || x !== xLast) {
      xtrim.push(x);
    }
    xLast = x;
  }
  return xtrim;
}

// Set the integerized blocks of area for the given rect
function paint(x, y, rect, area) {
  // y gets turned upside down when going from screen to pdf.
  const x1 = x.indexOf(rect.pos1.x);
  const x2 = x.indexOf(rect.pos2.x);
  const y1 = y.indexOf(rect.pos2.y);
  const y2 = y.indexOf(rect.pos1.y);

  for (let xx = x1; xx < x2; xx++) {
    for (let yy = y1; yy < y2; yy++) {
      area[xx][yy] = true;
    }
  }
  return area;
}

// Return index of edges for the indexed area.
function extractIndexEdges(area: any[], w, h): any {
  //  area[i0,j0]    has sides with
  //  i0 -> i+1   (i1)
  //  j0 -> j+1   (j1)

  //          i0       i1
  //
  //
  //   j0      ---------
  //           |        |
  //           |  i0,j0 |   i1,j0
  //           |        |
  //   j1      ---------
  //
  //              i0,j1

  const edges = [];

  // we look at squares y+1 and x+1 and add edges if they are different
  for (let i0 = 0; i0 < w - 1; i0++) {
    const i1 = i0 + 1;
    for (let j0 = 0; j0 < h - 1; j0++) {
      const j1 = j0 + 1;
      if (!!area[i0][j0] !== !!area[i1][j0]) {
        edges.push({ x1: i1, y1: j0, x2: i1, y2: j1 });
      }
      if (!!area[i0][j0] !== !!area[i0][j1]) {
        edges.push({ x1: i0, y1: j1, x2: i1, y2: j1 });
      }
    }
  }
  return edges;
}
