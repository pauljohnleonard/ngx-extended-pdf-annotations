import { AnnotationComment, PageEvent } from './classes';

export function setBoundingBoxOf(
  record: AnnotationComment,
  event: PageEvent
): void {
  let x1 = Number.MAX_SAFE_INTEGER,
    y1 = Number.MAX_SAFE_INTEGER,
    x2 = Number.MIN_SAFE_INTEGER,
    y2 = Number.MIN_SAFE_INTEGER;

  if (event.pos) {
    x1 = x2 = event.pos.x;
    y1 = y2 = event.pos.y;
  }

  if (event.path) {
    for (const l of event.path) {
      x1 = Math.min(l.pos1.x, x1);
      x2 = Math.max(l.pos2.x, x2);
      y1 = Math.min(l.pos1.y, y1);
      y2 = Math.max(l.pos2.y, y2);
    }
  }

  if (record.mark) {
    for (const l of record.mark.path) {
      x1 = Math.min(l.pos1.x, x1);
      x2 = Math.max(l.pos2.x, x2);
      y1 = Math.min(l.pos1.y, y1);
      y2 = Math.max(l.pos2.y, y2);
    }
  }

  record.mark.boundingBox = { x1, x2, y1, y2 };
}
