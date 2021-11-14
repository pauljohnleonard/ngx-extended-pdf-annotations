import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  AnnotationType,
  AnnotationPath,
  AnnotationPoint,
  AnnotationPageRect,
  PageEventType,
  AnnotationRecord,
  AnnotationMark,
  BoundingBox,
  AnnotationEdge,
  AnnotationPageEventType,
} from './classes';
import { AnnotationService } from './annotation.service';
import {
  HIGHLIGHT_BORDER,
  HIGHLIGHT_COLOUR as BORDER_HIGHLIGHT_COLOUR,
  HIGHLIGHT_LINE_WIDTH as BORDER_HIGHLIGHT_LINE_WIDTH,
  NOTE_ICON_HEIGHT,
  NOTE_ICON_WIDTH,
  TEXT_RECT_ALPHA,
  TEXT_RECT_COLOUR,
} from './constants';

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
  noteImg: HTMLImageElement;

  constructor(
    public pageViewer,
    public page: number,
    public annotationService: AnnotationService
  ) {
    this.updateCanvas(pageViewer);

    this.penSub = this.annotationService.focusHelper.modeSubject$.subscribe(
      (mode) => {
        switch (mode) {
          case AnnotationType.PEN:
          case AnnotationType.NOTE:
          case AnnotationType.TEXT:
            this.startAnnotation();
            break;

          case AnnotationType.OFF:
            this.endAnnotation('OFF');
            break;

          case AnnotationType.HIDE:
            this.visible(false);
            break;

          case AnnotationType.SHOW:
            this.visible(true);
            break;
        }

        this.enableTextLayer(
          mode !== AnnotationType.PEN && mode !== AnnotationType.NOTE
        );
      }
    );

    window.addEventListener('mouseup', this.mouseUpHandler.bind(this));
  }

  mapToPageRect(rect: DOMRect): AnnotationPageRect {
    if (!this.pageViewer.textLayer) {
      return null;
    }
    const pageRect =
      this.pageViewer.textLayer.textLayerDiv.getBoundingClientRect();

    if (!(rect.y >= pageRect.top && rect.y <= pageRect.bottom)) {
      return null;
    }

    if (rect.x <= pageRect.x) {
      return null;
    }

    if (rect.x <= pageRect.x) {
      return null;
    }
    if (rect.x + rect.width >= pageRect.x + pageRect.width) {
      return null;
    }

    // console.log({ pageRect, rect });
    // const { xOffset, yOffset } = getPosOfElement(this.pageViewer.canvas);
    const xOffset = pageRect.x;
    const yOffset = pageRect.y;

    // const n = 2;
    const pos1 = this.cursorToReal({
      offsetX: rect.x - xOffset,
      offsetY: rect.y - yOffset,
    });

    const pos2 = this.cursorToReal({
      offsetX: rect.x + rect.width - xOffset,
      offsetY: rect.y + rect.height - yOffset,
    });

    return { page: this.page, pos1, pos2 };
  }

  enableTextLayer(yes) {
    if (!this.pageViewer.textLayer) {
      return;
    }
    this.pageViewer.textLayer.textLayerDiv;

    this.pageViewer.textLayer.textLayerDiv.style['pointer-events'] = yes
      ? 'auto'
      : 'none';
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
    const mark = anno.mark;
    if (!anno.mark) {
      throw Error(' Expected annotation record to have a mark');
    }
    if (anno.mark.page !== this.page) {
      throw Error(' Expected this.page to be same as mark.page');
    }

    // this.showTops();

    // const clinetRect = this.canvas.getBoundingClientRect();
    // const canvasTop = clinetRect.top;

    let x, y;
    if (mark.pos) {
      x = mark.pos.x;
      y = mark.pos.y;
    } else {
      x = mark.boundingBox.x1; // + anno.mark.boundingBox.x2) / 2;
      y = mark.boundingBox.y2; // + anno.mark.boundingBox.y2) / 2;
    }

    const z = this.realToCanvas({ x, y });

    const pageDiv = this.annotationCanvas.parentElement.parentElement;

    const retY =
      pageDiv.offsetTop +
      (z.y * this.annotationCanvas.clientHeight) / this.annotationCanvas.height;
    return retY;
  }

  cursorToReal(e: { offsetX; offsetY }) {
    let z = this.pageViewer.viewport.convertToPdfPoint(e.offsetX, e.offsetY);

    return { x: z[0], y: z[1] };
  }

  realToCanvas(pos: AnnotationPoint) {
    let z = this.pageViewer.viewport.convertToViewportPoint(pos.x, pos.y);
    return {
      x: z[0] * this.pageViewer.outputScale.sx,
      y: z[1] * this.pageViewer.outputScale.sy,
    };
  }

  startAnnotation() {
    this.path = [];
    this.currentAnnotationId = null;
    this.annotationCanvas.onmousedown = this.mouseDownHandler.bind(this);
    this.annotationCanvas.onmousemove = this.mouseMoveHandler.bind(this);
    this.isActive = true;

    switch (this.annotationService.getMode()) {
      case AnnotationType.PEN:
        this.annotationCanvas.style.cursor =
          "url('/assets/ngx-extended-pdf-annotations/pencil.png')  0 32 ,auto";
        break;

      case AnnotationType.NOTE:
        this.annotationCanvas.style.cursor =
          "url('/assets/ngx-extended-pdf-annotations/note.png')  0 0 ,auto";
        break;
    }
    // ("url('http://wiki-devel.sugarlabs.org/images/e/e2/Arrow.cur'), auto");
    //("url('/assets/pencil.png'),pointer"); // " //'crosshair';
  }

  mouseDownHandler(e) {
    console.log('down ', { page: this.page, x: e.offsetX, y: e.offsetY });
    this.pos = this.cursorToReal(e);
    if (!this.currentAnnotationId) {
      this.currentAnnotationId = uuidv4();
      switch (this.annotationService.getMode()) {
        case AnnotationType.PEN:
          this.path = [];
          this.annotationService._handlePageEvent({
            id: this.currentAnnotationId,
            type: PageEventType.START,
            pos: this.pos,
            mode: AnnotationType.PEN,
            path: this.path,
            page: this.page,
            event: 'MOUSE_DOWN',
          });
          this.isDrawing = true;
          break;

        case AnnotationType.NOTE:
          this.annotationService._handlePageEvent({
            id: this.currentAnnotationId,
            type: PageEventType.START,
            pos: { x: this.pos.x - 8, y: this.pos.y + 8 },
            mode: AnnotationType.NOTE,
            page: this.page,
            event: 'MOUSE_DOWN',
          });
          this.isDrawing = false;
          break;
        default:
          this.isDrawing = false;
      }
    }
  }

  mouseMoveHandler(e) {
    // console.log('move', { page: this.page, x: e.offsetX, y: e.offsetY });
    if (this.isDrawing === true) {
      const pos2 = this.cursorToReal(e);
      this.path.push({ pos1: this.pos, pos2 });
      this.pos = pos2;
      this.annotationService._handlePageEvent({
        id: this.currentAnnotationId,
        type: PageEventType.UPDATE,
        event: 'MOUSE_MOVE',
      });

      // this.draw();
    }
  }

  mouseUpHandler(e) {
    // console.log('up', { page: this.page, x: e.offsetX, y: e.offsetY });
    if (this.isDrawing === true) {
      const pos2 = this.cursorToReal(e);
      this.path.push({ pos1: this.pos, pos2 });
      this.pos = pos2;
      this.isDrawing = false;
      this.annotationService._handlePageEvent({
        id: this.currentAnnotationId,
        type: PageEventType.UPDATE,
        event: 'MOUSE_UP',
      });
      // this.draw();
    }
  }

  updateCanvas(pageViewer: any) {
    // Add the event listeners for mousedown, mousemove, and mouseup

    // console.log(' UPDATE CANVAS ');

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

    // Copy source contents to annotation canvas.

    // console.log(this.canvas);

    if (this.isDrawing) {
      this.startAnnotation();
    }
  }

  drawTextBox(pageRect: AnnotationPageRect) {
    const ctx = this.annotationCanvas.getContext('2d');

    const pos1 = this.realToCanvas(pageRect.pos1);
    const pos2 = this.realToCanvas(pageRect.pos2);

    let width = Math.abs(pos2.x - pos1.x);
    let x = Math.min(pos1.x, pos2.x);

    let height = Math.abs(pos2.y - pos1.y);
    let y = Math.min(pos1.y, pos2.y);
    ctx.fillStyle = TEXT_RECT_COLOUR;
    ctx.globalAlpha = TEXT_RECT_ALPHA;
    ctx.globalCompositeOperation = 'darken';
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }

  drawTextHighLight(mark: AnnotationMark) {
    const edges = mark.edges;

    const ctx = this.annotationCanvas.getContext('2d');
    ctx.beginPath();
    ctx.lineWidth = BORDER_HIGHLIGHT_LINE_WIDTH;
    ctx.strokeStyle = BORDER_HIGHLIGHT_COLOUR;
    for (const edge of edges) {
      const pos1 = this.realToCanvas(edge.pos1);
      ctx.moveTo(pos1.x, pos1.y);
      const pos2 = this.realToCanvas(edge.pos2);
      ctx.lineTo(pos2.x, pos2.y);
    }
    ctx.stroke();
  }

  drawNoteMark(record: AnnotationRecord) {
    const ctx = this.annotationCanvas.getContext('2d');
    const pos = this.realToCanvas(record.mark.pos);
    ctx.drawImage(
      this.annotationService.noteImg,
      pos.x,
      pos.y,
      NOTE_ICON_WIDTH * this.pageViewer.outputScale.sx,
      NOTE_ICON_HEIGHT * this.pageViewer.outputScale.sy
    );
  }

  drawNoteHighLight(record: AnnotationRecord) {
    const ctx = this.annotationCanvas.getContext('2d');
    const pos = this.realToCanvas(record.mark.pos);
    ctx.beginPath();
    ctx.lineWidth = BORDER_HIGHLIGHT_LINE_WIDTH;
    ctx.strokeStyle = BORDER_HIGHLIGHT_COLOUR;
    ctx.rect(
      pos.x,
      pos.y,
      NOTE_ICON_WIDTH * this.pageViewer.outputScale.sx,
      NOTE_ICON_HEIGHT * this.pageViewer.outputScale.sy
    );
    ctx.stroke();
  }

  drawPenMark(record: AnnotationRecord) {
    const mark = record.mark;

    const path = mark.path;

    const ctx = this.annotationCanvas.getContext('2d');
    ctx.beginPath();
    const s = this.pageViewer.outputScale;
    ctx.lineJoin = 'round';
    let lastPos = null;
    for (const line of path) {
      // if (!lastPos || lastPos.x !== line.pos1.x || lastPos.y !== line.pos1.y) {
      const start = this.realToCanvas(line.pos1);
      ctx.moveTo(start.x, start.y);
      // }
      const end = this.realToCanvas(line.pos2);
      ctx.lineTo(end.x, end.y);
      lastPos = line.pos2;
    }
    ctx.closePath();

    const p1 = this.realToCanvas({ x: 0, y: 0 });
    const p2 = this.realToCanvas({ x: 1, y: 1 });

    const unitCanvas = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) * 1.5;

    ctx.lineWidth = Math.max(unitCanvas | 0, 1);

    ctx.strokeStyle = 'rgba(255,0,0,0.7)';

    ctx.stroke();
  }

  drawHighlightBox(boundingBox: BoundingBox) {
    const ctx = this.annotationCanvas.getContext('2d');

    const x1 = boundingBox.x1;
    const y1 = boundingBox.y1;

    const c1 = this.realToCanvas({ x: x1, y: y1 });

    const x2 = boundingBox.x2;
    const y2 = boundingBox.y2;

    const c2 = this.realToCanvas({ x: x2, y: y2 });
    const w = Math.abs(c2.x - c1.x);
    const h = Math.abs(c2.y - c1.y);

    const x = Math.min(c2.x, c1.x);
    const y = Math.min(c2.y, c1.y);

    ctx.beginPath();

    ctx.rect(
      x - HIGHLIGHT_BORDER,
      y - HIGHLIGHT_BORDER,
      w + HIGHLIGHT_BORDER * 2,
      h + HIGHLIGHT_BORDER * 2
    );
    ctx.lineWidth = BORDER_HIGHLIGHT_LINE_WIDTH;
    ctx.strokeStyle = BORDER_HIGHLIGHT_COLOUR;
    ctx.stroke();
  }

  clear() {
    const context = this.annotationCanvas.getContext('2d');
    context.clearRect(
      0,
      0,
      this.annotationCanvas.width,
      this.annotationCanvas.height
    );

    const ctx = this.annotationCanvas.getContext('2d');

    ctx.drawImage(this.pdfCanvas, 0, 0);
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

  endAnnotation(event: AnnotationPageEventType) {
    this.detachPen();

    if (!!this.currentAnnotationId) {
      this.annotationService._handlePageEvent({
        id: this.currentAnnotationId,
        type: PageEventType.PEN_UP,
        event,
      });
    }

    this.path = [];
    this.currentAnnotationId = null;
    this.isActive = false;
  }

  destroy() {
    this.endAnnotation('DESTROY');
    if (this.penSub) {
      this.penSub.unsubscribe();
      delete this.penSub;
    }
  }
}
