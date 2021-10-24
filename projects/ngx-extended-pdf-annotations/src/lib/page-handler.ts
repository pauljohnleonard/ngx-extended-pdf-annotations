import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  AnnotationMark,
  AnnotationMode,
  AnnotationPath,
  AnnotationRecord,
  PageEventType as PageEventType,
} from './classes';
import { AnnotationService } from './annotation.service';

export class PageHandler {
  path: AnnotationPath = [];

  ctx: CanvasRenderingContext2D;
  penSub: Subscription;
  isActive = false;
  pos: { x: number; y: number };
  isDrawing: boolean;
  canvas: HTMLCanvasElement;
  currentAnnotationId: string;

  constructor(
    public pageViewer,
    public page: number,
    public annotationService: AnnotationService
  ) {
    // Add the event listeners for mousedown, mousemove, and mouseup
    this.pageViewer = pageViewer;
    this.page = page;
    this.canvas = this.pageViewer.canvas;
    this.penSub = this.annotationService.subject$.subscribe((mode) => {
      if (annotationService.penIsOn && !this.isActive) {
        this.startAnnotation();
      } else if (this.isActive) {
        this.endAnnotation();
      }
    });
    window.addEventListener('mouseup', this.mouseUpHandler.bind(this));
  }

  showTops() {
    let el: HTMLElement = this.canvas;

    while (el) {
      const str = `${el.localName}:${el.className} ${el.offsetTop}`;
      console.log(str);
      el = el.parentElement;
    }
  }

  // Y center of annotation bounding box in terms of full viewport.
  getAnnotationPanelPos(anno: AnnotationRecord): number {
    if (!anno.mark) {
      throw Error(' Expected annotation record to have a mark');
    }
    if (anno.mark.page !== this.page) {
      throw Error(' Expected this.page to be same as mark.page');
    }

    this.showTops();

    // const clinetRect = this.canvas.getBoundingClientRect();
    // const canvasTop = clinetRect.top;
    const x = (anno.mark.boundingBox.x1 + anno.mark.boundingBox.x2) / 2;
    const y = (anno.mark.boundingBox.y1 + anno.mark.boundingBox.y2) / 2;
    const z = this.realToCanvas({ x, y });

    const pageDiv = this.canvas.parentElement.parentElement;

    const retY =
      pageDiv.offsetTop + (z.y * this.canvas.clientHeight) / this.canvas.height;
    return retY;
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
      this.annotationService.annotationManager._handlePageEvent({
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
      this.annotationService.annotationManager._handlePageEvent({
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
      this.annotationService.annotationManager._handlePageEvent({
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
      this.annotationService.annotationManager._handlePageEvent({
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
