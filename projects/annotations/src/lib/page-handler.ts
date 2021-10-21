import { Subscription } from 'rxjs';
import {
  AnnotationEventType,
  AnnotationPanelWrapperComponent,
  AnnotationPath,
} from './annotations-panel-wrapper.component';

import { v4 as uuidv4 } from 'uuid';

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
  currentAnnotationId: any;

  constructor(
    pageViewer,
    page,
    annotationWrapper: AnnotationPanelWrapperComponent
  ) {
    // Add the event listeners for mousedown, mousemove, and mouseup
    this.pageViewer = pageViewer;
    this.page = page;
    this.annotationWrapper = annotationWrapper;

    this.penSub = this.annotationWrapper.subject$.subscribe(() => {
      if (annotationWrapper.penIsOn && !this.isActive) {
        this.activatePen();
      } else if (this.isActive) {
        this.disablePen();
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

  activatePen() {
    if (!this.canvas) {
      this.canvas = this.pageViewer.canvas;
    }
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
      this.currentAnnotationId = this.annotationWrapper.annotationSubject$.next(
        {
          id: this.currentAnnotationId,
          type: AnnotationEventType.START,
          pos: this.pos,
        }
      );
    }
    console.log('down', {
      x: e.offsetX,
      y: e.offsetY,
      x1: this.pos.x,
      y1: this.pos.y,
    });
    this.isDrawing = true;
  }

  mouseMoveHandler(e) {
    // console.log('move', e);
    if (this.isDrawing === true) {
      const pos2 = this.cursorToReal(e);
      this.path.push({ pos1: this.pos, pos2 });
      this.pos = pos2;
      this.draw();
    }
  }

  mouseUpHandler(e) {
    // console.log('up', e);
    if (this.isDrawing === true) {
      const pos2 = this.cursorToReal(e);
      this.path.push({ pos1: this.pos, pos2 });
      this.pos = pos2;
      this.isDrawing = false;
      this.draw();
    }
  }

  update(source: any) {
    this.disablePen();
    this.pageViewer = source;
    this.canvas = this.pageViewer.canvas;
    if (this.isDrawing) {
      this.activatePen();
    }
    setTimeout(() => this.draw());
  }

  draw() {
    this.ctx = this.canvas.getContext('2d');
    this.ctx.beginPath();
    const s = this.pageViewer.outputScale;
    for (const line of this.path) {
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

  disablePen() {
    if (this.canvas) {
      this.canvas.style.cursor = 'default';

      this.canvas.onmousedown = null;
      this.canvas.onmouseup = null;
      delete this.canvas;
    }
    this.isActive = false;

    if (!!this.currentAnnotationId) {
      this.annotationWrapper.annotationSubject$.next({
        id: this.currentAnnotationId,
        path: this.path,
        type: AnnotationEventType.END,
      });
    }
  }

  destroy() {
    this.disablePen();
    if (this.penSub) {
      this.penSub.unsubscribe();
      delete this.penSub;
    }
  }
}
