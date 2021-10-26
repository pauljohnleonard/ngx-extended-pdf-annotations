import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import {
  AnnotationMark,
  AnnotationMode,
  AnnotationRecord,
  AnnotationType,
  AnnotationUser,
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

  user: AnnotationUser = { name: 'Guest', id: '1234' };
  cnt = 0;
  mode = AnnotationMode.OFF;
  focusComment: UIPannelComment;
  highlightComment: any;

  constructor() {
    console.log(' PanelHelper INIT');
    this.initAnnotationListener();
  }

  setUser(user: AnnotationUser) {
    this.user = user;
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

  hadleHightlightChange() {
    const oldHighlight: UIPannelComment = this.highlightComment;
    const newHighlight =
      this.focusComment && this.mode === AnnotationMode.OFF
        ? this.focusComment
        : null;
    if (newHighlight !== this.highlightComment) {
      this.highlightComment = newHighlight;
      this.sortComments();
    }

    setTimeout(() => {
      if (oldHighlight) {
        this._redraw(oldHighlight.pos.page);
        if (newHighlight && newHighlight.pos.page !== oldHighlight.pos.page) {
          this._redraw(newHighlight.pos.page);
        }
      } else if (newHighlight && newHighlight.pos.page) {
        this._redraw(newHighlight.pos.page);
      }
    });
  }

  renderer(record: AnnotationRecord) {
    if (!record.mark) return;
    const page = this.pages[record.mark.page];

    const highlight =
      this.highlightComment && record.id === this.highlightComment.record.id;
    // this.mode === AnnotationMode.OFF &&
    //   this.focusComment &&
    //   record.id === this.focusComment.record.id;

    page.draw(record, highlight);
    // console.log(' RENDER ', page);
  }

  sortComments() {
    setTimeout(() => {
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
          comment.pos.yPlot = Math.max(comment.pos.y, yPlot + 10);
          yPlot = comment.pos.yPlot + comment.component.getHeight();
        }
      }
    });
  }

  // Do this if the zoom changes
  rebuildCommentPostions() {
    for (const c of this.comments) {
      c.pos = this.getAnnotationPanelPos(c.record);
    }
  }

  async initAnnotationListener() {
    // TODO destory
    this.sub = this.newRecord$.subscribe((record) => {
      const pos = this.getAnnotationPanelPos(record);
      const comment: UIPannelComment = {
        pos,
        record,
      };

      this.focusComment = comment;
      this.comments.push(comment);

      // give angluar time to add to dom.
      setTimeout(() => this.sortComments());
      // console.log(' New comment', JSON.stringify(comment, null, 2));
    });
  }

  pageRendered(evt) {
    console.log(' PAGE RENDER  ', evt.pageNumber);
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
    if (this.mode === AnnotationMode.OFF || this.mode === AnnotationMode.HIDE) {
      this.focusComment = null;
    }
    this.hadleHightlightChange();
    this.subject$.next(mode);
  }

  zoomChange(evt) {
    console.log(' ZOOM CHANGE ');
    setTimeout(() => {
      this.rebuildCommentPostions();
      this.sortComments();
      setTimeout(() => this._redraw());
    });
  }

  _focusOnComment(comment: UIPannelComment) {
    if (this.focusComment === comment) {
      return;
    }
    this.setMode(AnnotationMode.OFF);
    this.focusComment = comment;
    this.hadleHightlightChange();
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
        creator: this.user,
        createdAt: new Date().toISOString(),
      };
      setBoundingBoxOf(record, event);
      this._addNewRecord(record);
    } else {
      setBoundingBoxOf(record, event);
    }

    this.renderer(record);
  }

  // if no page then redraw all
  _redraw(page?: number) {
    console.log(' _REDRAW', page);

    if (page !== undefined) {
      const pageHandler = this.pages[page];
      pageHandler.clear();
    }

    for (const id of Object.keys(this.annotationMap)) {
      const record = this.annotationMap[id];
      if (page === undefined || (record.mark && record.mark.page === page)) {
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

  // _layoutChange() {}

  _deleteComment(comment: UIPannelComment) {
    if (this.mode !== AnnotationMode.HIDE) {
      this.setMode(AnnotationMode.OFF);
    }
    const ii = this.comments.findIndex((x) => x === comment);
    this.comments.splice(ii, 1);
    this.sortComments();
    const id = comment.record.id;
    delete this.annotationMap[id];
    const page = comment.pos.page;
    this._redraw(page);
  }
}
