import { Subscription } from 'rxjs';
import {
  AnnotationPanelWrapperComponent,
  AnnotationPath,
} from './annotations-panel-wrapper.component';

import { v4 as uuidv4 } from 'uuid';
import {
  AnnotationMark,
  AnnotationMode,
  PageEventType as PageEventType,
} from './classes';

export class PageHandler {
  pageViewer: any;
  path: AnnotationPath = [];

  page: any;
  ctx: CanvasRenderingContext2D;
  annotationWrapper: AnnotationPanelWrapperComponent;
  penSub: Subscription;
  isActive = false;
  pos: { x: number; y: number };
  isDrawing: boolean;
  canvas: HTMLCanvasElement;
  currentAnnotationId: string;

  constructor(
    pageViewer,
    page,
    annotationWrapper: AnnotationPanelWrapperComponent
  ) {
    // Add the event listeners for mousedown, mousemove, and mouseup
    this.pageViewer = pageViewer;
    this.page = page;
    this.annotationWrapper = annotationWrapper;
    this.canvas = this.pageViewer.canvas;
    this.penSub = this.annotationWrapper.subject$.subscribe((mode) => {
      if (annotationWrapper.penIsOn && !this.isActive) {
        this.startAnnotation();
      } else if (this.isActive) {
        this.endAnnotation();
      }
    });
    window.addEventListener('mouseup', this.mouseUpHandler.bind(this));
  }

  cursorToReal(e) {
    let z = this.pageViewer.viewport.convertToPdfPoint(e.offsetX, e.offsetY);

    return { x: z[0], y: z[1] };
  }

  realToCanvas(pos) {
    let z = this.pageViewer.viewport.convertToViewportPoint(pos.x, pos.y);
    return {
      x: z[0] * this.pageViewer.outputScale.sx,
      y: z[1] * this.pageViewer.outputScale.sx,
    };

    // { x: pos.x * this.pageViewer.outputScale.sx, y: pos.y * this.pageViewer.outputScale.sy };
  }

  startAnnotation() {
    this.path = [];
    this.currentAnnotationId = null;
    this.canvas = this.pageViewer.canvas; // not needed ?
    this.canvas.onmousedown = this.mouseDownHandler.bind(this);
    this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
    this.isActive = true;
    this.canvas.style.cursor = 'crosshair';
  }

  mouseDownHandler(e) {
    console.log('down', { x: e.offsetX, y: e.offsetY });
    this.pos = this.cursorToReal(e);
    if (!this.currentAnnotationId) {
      this.currentAnnotationId = uuidv4();
      this.path = [];
      this.annotationWrapper.annotationManager._handlePageEvent({
        id: this.currentAnnotationId,
        type: PageEventType.START,
        pos: this.pos,
        mode: AnnotationMode.PEN,
        path: this.path,
        page: this.page,
      });
    }
//     console.log('down', {
//       x: e.offsetX,
//       y: e.offsetY,
//       x1: this.pos.x,
//       y1: this.pos.y,
//     });
    this.isDrawing = true;
  }

  mouseMoveHandler(e) {
    // console.log('move', e);
    if (this.isDrawing === true) {
      const pos2 = this.cursorToReal(e);
      this.path.push({ pos1: this.pos, pos2 });
      this.pos = pos2;
      this.annotationWrapper.annotationManager._handlePageEvent({
        id: this.currentAnnotationId,
        type: PageEventType.UPDATE,
      });
      // this.draw();
    }
  }

  mouseUpHandler(e) {
    // console.log('up', e);
    if (this.isDrawing === true) {
      const pos2 = this.cursorToReal(e);
      this.path.push({ pos1: this.pos, pos2 });
      this.pos = pos2;
      this.isDrawing = false;
      this.annotationWrapper.annotationManager._handlePageEvent({
        id: this.currentAnnotationId,
        type: PageEventType.UPDATE,
      });
      // this.draw();
    }
  }

  update(source: any) {
    this.endAnnotation();
    this.pageViewer = source;
    this.canvas = this.pageViewer.canvas;
    if (this.isDrawing) {
      this.startAnnotation();
    }
    // setTimeout(() => this.draw());
  }

  draw(mark: AnnotationMark) {
    const path = mark.path;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.beginPath();
    const s = this.pageViewer.outputScale;
    for (const line of path) {
      const start = this.realToCanvas(line.pos1);
      this.ctx.moveTo(start.x, start.y);
      const end = this.realToCanvas(line.pos2);
      this.ctx.lineTo(end.x, end.y);
    }
    this.ctx.closePath();
    this.ctx.lineWidth = 6;
    this.ctx.strokeStyle = 'red';
    this.ctx.stroke();
  }

  endAnnotation() {
    if (this.canvas) {
      this.canvas.style.cursor = 'default';
      this.canvas.onmousedown = null;
      this.canvas.onmouseup = null;
    }

    if (!!this.currentAnnotationId) {
      this.annotationWrapper.annotationManager._handlePageEvent({
        id: this.currentAnnotationId,
        type: PageEventType.PEN_UP,
      });
    }

    this.path = [];
    this.currentAnnotationId = null;
    this.isActive = false;
  }

  destroy() {
    this.endAnnotation();
    if (this.penSub) {
      this.penSub.unsubscribe();
      delete this.penSub;
    }
  }
}
