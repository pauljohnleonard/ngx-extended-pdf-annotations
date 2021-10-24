import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import {
  AnnotationMode,
  AnnotationRecord,
  PanelPosition,
  PanelPositionHelper,
  UIPannelComment,
} from './classes';
import { PageHandler } from './page-handler';
import { PDFAnnotationManager } from './pdf-annotation-manager';

@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  pages: { [page: number]: PageHandler } = {}; // PDFPageVIew
  comments: UIPannelComment[] = [];

  annotationMap: { [id: string]: AnnotationRecord } = {};
  public newRecord$ = new Subject<AnnotationRecord>();
  panelPositionHelper: PanelPositionHelper;
  sub: Subscription;
  annotationManager: PDFAnnotationManager;
  mode = AnnotationMode.OFF;
  public subject$ = new Subject<AnnotationMode>();

  constructor() {
    console.log(' PanelHelper INIT');
    this.initAnnotationListener();
  }

  get penIsOn() {
    return this.mode === AnnotationMode.PEN;
  }

  _addNewRecord(record: AnnotationRecord): boolean {
    if (this.annotationMap[record.id]) return false;
    this.annotationMap[record.id] = record;
    this.newRecord$.next(record);
    return true;
  }

  getAnnotationPanelPos(anno: AnnotationRecord): PanelPosition {
    if (!this.panelPositionHelper) {
      throw new Error(
        'AnnotationService: you must provide a PanelPositionHelper'
      );
    }

    // TODO motive !== comment;
    const y = this.panelPositionHelper.getAnnotationPanelPos(anno);

    const pos: PanelPosition = { page: anno.mark.page, rank: 0, y, yPlot: y };
    console.log('POS ', pos);
    return pos;
  }

  setPanelPositionHelper(pannelPosHelper: PanelPositionHelper) {
    this.panelPositionHelper = pannelPosHelper;

    const renderer = (record: AnnotationRecord) => {
      if (!record.mark) return;
      const page = this.pages[record.mark.page];
      page.draw(record.mark);
      // console.log(' RENDER ', page);
    };

    this.annotationManager = new PDFAnnotationManager(renderer, this);
  }

  sortComments() {
    let yPlot = -1;
    this.comments.sort((a, b) => {
      if (a.pos.page > b.pos.page) return 1;
      if (a.pos.page < b.pos.page) return -1;

      // Same page
      if (a.pos.y > b.pos.y) return 1;
      if (a.pos.y < b.pos.y) return -1;

      return 0;
    });

    for (const comment of this.comments) {
      if (comment.pos.y < 0) {
        comment.pos.yPlot = -1;
        continue;
      }
      if (!comment.component) {
        console.error(' Expect comment to belong to a elem !!');
      } else {
        comment.pos.yPlot = Math.max(comment.pos.y, yPlot);
        yPlot = comment.pos.yPlot + comment.component.getHeight();
      }
    }
  }

  async initAnnotationListener() {
    // TODO destory
    this.sub = this.newRecord$.subscribe((record) => {
      const pos = this.getAnnotationPanelPos(record);
      const comment: UIPannelComment = {
        pos,
        record,
        editing: true,
      };

      this.comments.push(comment);

      // give angluar time to add to dom.
      setTimeout(() => this.sortComments());
      // console.log(' New comment', JSON.stringify(comment, null, 2));
    });
  }

  pageRendered(evt) {
    //     console.log('Page render ', evt.source);
    const page = evt.pageNumber;
    if (!this.pages[page]) {
      const pageHandler = new PageHandler(evt.source, page, this);
      this.pages[page] = pageHandler;
    } else {
      this.pages[page].update(evt.source);
      this.annotationManager._redraw(page);
    }
  }

  setMode(mode: AnnotationMode) {
    this.mode = mode;
    this.subject$.next(this.mode);
  }

  destroy() {
    this.sub.unsubscribe();
  }

  stopPenAnnoation() {
    this.setMode(AnnotationMode.OFF);
  }

  startPenAnnoation() {
    this.setMode(AnnotationMode.PEN);
  }

  pdfLoaded(evt) {
    this.subject$.next(AnnotationMode.READY);
  }
}
