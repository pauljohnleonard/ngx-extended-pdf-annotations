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

  private ctx: CanvasRenderingContext2D;
  penSub: Subscription;
  isActive = false;
  pos: { x: number; y: number };
  isDrawing: boolean;
  currentAnnotationId: string;

  private annotationCanvas: HTMLCanvasElement;
  private pdfCanvas: HTMLCanvasElement;

  constructor(
    public pageViewer,
    public page: number,
    public annotationService: AnnotationService
  ) {
    this.page = page;

    this.updateCanvas(pageViewer);

    this.penSub = this.annotationService.subject$.subscribe((mode) => {
      switch (mode) {
        case AnnotationMode.PEN:
          this.startAnnotation();
          break;

        case AnnotationMode.OFF:
          this.endAnnotation();
          break;

        case AnnotationMode.HIDE:
          this.visible(false);
          break;

        case AnnotationMode.SHOW:
          this.visible(true);
          break;
      }
    });
    window.addEventListener('mouseup', this.mouseUpHandler.bind(this));
  }

  // showTops() {
  //   let el: HTMLElement = this.annotationCanvas;
  //   while (el) {
  //     const str = `${el.localName}:${el.className} ${el.offsetTop}`;
  //     console.log(str);
  //     el = el.parentElement;
  //   }
  // }

  // Y center of annotation bounding box in terms of full viewport.
  getAnnotationPanelPos(anno: AnnotationRecord): number {
    if (!anno.mark) {
      throw Error(' Expected annotation record to have a mark');
    }
    if (anno.mark.page !== this.page) {
      throw Error(' Expected this.page to be same as mark.page');
    }

    // this.showTops();

    // const clinetRect = this.canvas.getBoundingClientRect();
    // const canvasTop = clinetRect.top;
    const x = (anno.mark.boundingBox.x1 + anno.mark.boundingBox.x2) / 2;
    const y = (anno.mark.boundingBox.y1 + anno.mark.boundingBox.y2) / 2;
    const z = this.realToCanvas({ x, y });

    const pageDiv = this.annotationCanvas.parentElement.parentElement;

    const retY =
      pageDiv.offsetTop +
      (z.y * this.annotationCanvas.clientHeight) / this.annotationCanvas.height;
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
    // this.annotationCanvas = this.pageViewer.canvas; // not needed ?
    this.annotationCanvas.onmousedown = this.mouseDownHandler.bind(this);
    this.annotationCanvas.onmousemove = this.mouseMoveHandler.bind(this);
    this.isActive = true;
    this.annotationCanvas.style.cursor = 'crosshair';
  }

  mouseDownHandler(e) {
    console.log('down', { x: e.offsetX, y: e.offsetY });
    this.pos = this.cursorToReal(e);
    if (!this.currentAnnotationId) {
      this.currentAnnotationId = uuidv4();
      this.path = [];
      this.annotationService._handlePageEvent({
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
      this.annotationService._handlePageEvent({
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
      this.annotationService._handlePageEvent({
        id: this.currentAnnotationId,
        type: PageEventType.UPDATE,
      });
      // this.draw();
    }
  }

  updateCanvas(pageViewer: any) {
    // Add the event listeners for mousedown, mousemove, and mouseup

    this.detachPen();

    if (this.annotationCanvas && this.annotationCanvas.parentNode) {
      this.annotationCanvas.parentNode.removeChild(this.annotationCanvas);
    }
    this.pageViewer = pageViewer;
    this.pdfCanvas = this.pageViewer.canvas;

    this.annotationCanvas = document.createElement(
      'CANVAS'
    ) as HTMLCanvasElement;

    this.annotationCanvas.width = this.pdfCanvas.width;
    this.annotationCanvas.height = this.pdfCanvas.height;
    this.annotationCanvas.style.width = this.pdfCanvas.style.width;
    this.annotationCanvas.style.height = this.pdfCanvas.style.height;

    this.pdfCanvas.style.position = 'absolute';
    this.annotationCanvas.style.position = 'absolute';
    this.annotationCanvas.id = 'mycanvas';
    // this.canvas.style['z-index'] = '30';
    // this.pdfCanvas.style['z-index'] = '20';

    this.pdfCanvas.parentElement.appendChild(this.annotationCanvas);

    // console.log(this.canvas);

    if (this.isDrawing) {
      this.startAnnotation();
    }
  }

  draw(mark: AnnotationMark) {
    const path = mark.path;

    this.ctx = this.annotationCanvas.getContext('2d');
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

  visible(yes) {
    if (!this.annotationCanvas) {
      return;
    }
    if (yes) {
      this.annotationCanvas.style.display = 'block';
    } else {
      this.annotationCanvas.style.display = 'none';
    }
  }

  detachPen() {
    if (this.annotationCanvas) {
      this.annotationCanvas.style.cursor = 'default';
      this.annotationCanvas.onmousedown = null;
      this.annotationCanvas.onmouseup = null;
    }
  }

  endAnnotation() {
    this.detachPen();

    if (!!this.currentAnnotationId) {
      this.annotationService._handlePageEvent({
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
