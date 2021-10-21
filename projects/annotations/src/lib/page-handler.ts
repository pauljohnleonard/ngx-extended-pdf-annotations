export class PageHandler {
  pageViewer: any;
  path: { pos1: { x; y }; pos2: { x; y } }[] = [];

  mouseUp: (e: any) => void;
  page: any;
  ctx: CanvasRenderingContext2D;

  constructor(pageViewer, page) {
    // Add the event listeners for mousedown, mousemove, and mouseup
    this.pageViewer = pageViewer;
    this.page = page;

    this.rebuild();
  }

  cursorToReal(e) {
    let z = this.pageViewer.viewport.convertToPdfPoint(e.offsetX, e.offsetY);

    return { x: z[0], y: z[1] };
  }

  realToCanvas(pos) {
    let z = this.pageViewer.viewport.convertToViewportPoint(pos.x, pos.y);
    return { x: z[0] * this.pageViewer.outputScale.sx, y: z[1] * this.pageViewer.outputScale.sx };

    // { x: pos.x * this.pageViewer.outputScale.sx, y: pos.y * this.pageViewer.outputScale.sy };
  }

  rebuild() {
    let pos: { x; y };
    let isDrawing;

    const self: PageHandler = this;

    this.pageViewer.canvas.onmousedown = function mouseDown(e) {
      console.log('down', { x: e.offsetX, y: e.offsetY });
      pos = self.cursorToReal(e);
      console.log('down', { x: e.offsetX, y: e.offsetY, x1: pos.x, y1: pos.y });
      isDrawing = true;
    };

    this.pageViewer.canvas.onmousemove = function mouseMove(e) {
      // console.log('move', e);
      if (isDrawing === true) {
        const pos2 = self.cursorToReal(e);
        self.path.push({ pos1: pos, pos2 });
        pos = pos2;

        self.draw();
      }
    };

    this.mouseUp = function mouseUp(e) {
      // console.log('up', e);
      if (isDrawing === true) {
        const pos2 = self.cursorToReal(e);
        self.path.push({ pos1: pos, pos2 });
        pos = pos2;
        isDrawing = false;
        self.draw();
      }
    };
    window.addEventListener('mouseup', this.mouseUp);
  }
  update(source: any) {
    this.destroy();
    this.pageViewer = source;
    this.rebuild();
    this.draw();
  }

  draw() {
    this.ctx = this.pageViewer.canvas.getContext('2d');
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

  destroy() {
    this.pageViewer.onmousedown = null;
    this.pageViewer.onmouseup = null;
    window.removeEventListener('mouseup', this.mouseUp);
  }
}
