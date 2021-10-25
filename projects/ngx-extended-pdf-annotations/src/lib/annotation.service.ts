import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import {
  AnnotationMark,
  AnnotationMode,
  AnnotationRecord,
  AnnotationType,
  PageEvent,
  PanelPosition,
  PanelPositionHelper,
  UIPannelComment,
} from './classes';
import { PageHandler } from './page-handler';
import { setBoundingBoxOf } from './util';

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
  // mode = AnnotationMode.OFF;
  public subject$ = new Subject<AnnotationMode>();

  user = 'Paul';
  cnt = 0;
  mode: AnnotationMode;

  constructor() {
    console.log(' PanelHelper INIT');
    this.initAnnotationListener();
  }

  isActive(): boolean {
    return this.mode !== AnnotationMode.HIDE;
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

  toggleAnnotations() {
    if (this.mode === AnnotationMode.HIDE) {
      this.setMode(AnnotationMode.SHOW);
    } else {
      this.setMode(AnnotationMode.HIDE);
    }
  }

  // delete annotations
  // if no argument delete all.
  deleteAnnotations(arg?: { annotationIds: string[] }) {}

  // update the given annotation
  updateAnnotation(data: AnnotationRecord) {}

  // add new annoations.
  addAnnotations(arg: AnnotationRecord[]) {}

  // get penIsOn() {
  //   return this.mode === AnnotationMode.PEN;
  // }

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
  }

  renderer(record: AnnotationRecord) {
    if (!record.mark) return;
    const page = this.pages[record.mark.page];
    page.draw(record.mark);
    // console.log(' RENDER ', page);
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
    const page = evt.pageNumber;
    if (!this.pages[page]) {
      const pageHandler = new PageHandler(evt.source, page, this);
      this.pages[page] = pageHandler;
    } else {
      this.pages[page].updateCanvas(evt.source);
      setTimeout(() => this._redraw(page));
    }
  }

  setMode(mode: AnnotationMode) {
    this.mode = mode;
    this.subject$.next(mode);
  }

  // Internal stuff
  _handlePageEvent(event: PageEvent) {
    const id = event.id;
    let record: AnnotationRecord = this.annotationMap[id];
    if (!record) {
      let type: AnnotationType;

      switch (event.mode) {
        case AnnotationMode.PEN:
          type = AnnotationType.PATH;
      }

      const mark: AnnotationMark = {
        page: event.page,
        path: event.path,
        type,
      };

      record = {
        id: event.id,
        bodyValue: 'My Comment ' + this.cnt++,
        mark,
        motivation: 'comment',
        creator: {
          id: '',
          name: this.user,
        },
        createdAt: new Date().toISOString(),
      };
      setBoundingBoxOf(record, event);
      this._addNewRecord(record);
    }
    this.renderer(record);
  }

  // if no page then redraw all
  _redraw(page?: number) {
    for (const id of Object.keys(this.annotationMap)) {
      const record = this.annotationMap[id];
      if (!page || (record.mark && record.mark.page === page)) {
        this.renderer(record);
      }
    }
  }

  _addNewRecord(record: AnnotationRecord): boolean {
    if (this.annotationMap[record.id]) return false;
    this.annotationMap[record.id] = record;
    this.newRecord$.next(record);
    return true;
  }

  _layoutChange() {
    setTimeout(() => this.sortComments());
  }

  _deleteComment(comment: UIPannelComment) {
    const ii = this.comments.findIndex((x) => x === comment);
    this.comments.splice(ii, 1);
    this.sortComments();
  }
}
