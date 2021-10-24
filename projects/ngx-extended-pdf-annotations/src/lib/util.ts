import {
  AnnotationMark,
  AnnotationMarkRender,
  AnnotationMode,
  AnnotationRecord,
  AnnotationType,
  BoundingBox,
  PageEvent,
} from './classes';

export function setBoundingBoxOf(
  record: AnnotationRecord,
  event: PageEvent
): void {
  let x1 = null,
    y1 = null,
    x2 = null,
    y2 = null;

  if (event.pos) {
    x1 = x2 = event.pos.x;
    y1 = y2 = event.pos.y;
  }

  if (event.path) {
    for (const l of event.path) {
      x1 = Math.min(l.pos1.x, x1);
      x2 = Math.max(l.pos1.y, x1);
      x1 = Math.min(l.pos2.y, x1);
      x2 = Math.max(l.pos2.x, x1);
    }
  }

  record.mark.boundingBox = { x1, x2, y1, y2 };
}
