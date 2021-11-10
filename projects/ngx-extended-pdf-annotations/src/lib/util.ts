import {
  AnnotationPageRect,
  AnnotationRecord,
  AnnotationType,
  PageEvent,
  PageEventType,
} from './classes';
import { NOTE_ICON_HEIGHT, NOTE_ICON_WIDTH } from './constants';

export function setBoundingBoxOf(
  record: AnnotationRecord,
  event: PageEvent
): void {
  const mark = record.mark;
  let x1 = Number.MAX_SAFE_INTEGER,
    y1 = Number.MAX_SAFE_INTEGER,
    x2 = Number.MIN_SAFE_INTEGER,
    y2 = Number.MIN_SAFE_INTEGER;

  if (mark.type === AnnotationType.NOTE) {
    if (event.type !== PageEventType.START) {
      return;
    }
    x1 = x2 = event.pos.x;
    y1 = y2 = event.pos.y;
    mark.boundingBox = {
      x1,
      x2: x1 + NOTE_ICON_WIDTH,
      y1,
      y2: y1 + NOTE_ICON_HEIGHT,
    };
  } else {
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

    if (mark && mark.path) {
      // WTF ???
      for (const l of mark.path) {
        x1 = Math.min(l.pos1.x, x1);
        x2 = Math.max(l.pos2.x, x2);
        y1 = Math.min(l.pos1.y, y1);
        y2 = Math.max(l.pos2.y, y2);
      }
    }

    mark.boundingBox = { x1, x2, y1, y2 };
  }
}

export function getPosOfElement(elm: HTMLElement): {
  xOffset: number;
  yOffset: number;
} {
  var xOffset = 0;
  var yOffset = 0;
  while (elm != null) {
    xOffset += elm.offsetTop;
    yOffset += elm.offsetLeft;
    elm = elm.offsetParent as HTMLElement;
  }
  return { xOffset, yOffset };
}
