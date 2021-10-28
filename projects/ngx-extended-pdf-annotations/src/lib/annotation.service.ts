import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import {
  AnnotationMark,
  AnnotationMessage,
  AnnotationMessageEnum,
  AnnotationMode,
  AnnotationRecord,
  AnnotationStorage,
  AnnotationType,
  AnnotationUser,
  FocusModeEnum,
  PageEvent,
  PanelPosition,
  UIPannelComment,
} from './classes';

import { PageHandler } from './page-handler';
import { setBoundingBoxOf } from './util';

@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  private pages: { [page: number]: PageHandler } = {}; // PDFPageVIew

  private annotationMap: { [id: string]: AnnotationRecord } = {};
  private user: AnnotationUser = { userName: 'Guest', userId: '1234' };
  private cnt = 0;
  private sub: Subscription;
  private focusComment: UIPannelComment = null;
  private highlightComment: UIPannelComment = null;
  private _mode = AnnotationMode.OFF;
  _comments: UIPannelComment[] = [];
  public modeSubject$ = new Subject<AnnotationMode>();
  public newRecord$ = new Subject<AnnotationRecord>();
  storage: AnnotationStorage = {
    addAnnotation: (anno: AnnotationRecord) => {
      console.log(' NO STORAGE SET');
    },
    updateAnnotation: (anno: AnnotationRecord) => {
      console.log(' NO STORAGE SET');
    },
  };
  isPrivate: true;
  // public subject$ = new Subject<AnnotationMessage>();

  constructor() {
    console.log(' PanelHelper INIT');
    this.initAnnotationListener();
  }

  setStorage(storage: AnnotationStorage) {
    this.storage = storage;
  }
  getMode() {
    return this._mode;
  }
  // Interface to ngx-extended-pdf-viewer -----------------------------------------------------------------------------------------

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

  zoomChange(evt) {
    console.log(' ZOOM CHANGE ');
    setTimeout(() => {
      this.rebuildCommentPostions();
      this.sortComments();
      setTimeout(() => this._redraw());
    });
  }

  pdfLoaded(evt) {
    this.modeSubject$.next(AnnotationMode.READY);
  }

  pannelPosHelper(record: AnnotationRecord) {
    const page = this.pages[record.mark.page];
    return page.getAnnotationPanelPos(record);
  }

  // Public interface -----------------------------------------------------------------------------------------

  setUser(user: AnnotationUser) {
    this.user = user;
  }

  isActive(): boolean {
    return this._mode !== AnnotationMode.HIDE;
  }

  stopPenAnnoation() {
    this.setMode(AnnotationMode.OFF);
  }

  startPenAnnoation() {
    this.setMode(AnnotationMode.PEN);
  }

  toggleAnnotations() {
    if (this._mode === AnnotationMode.HIDE) {
      this.setMode(AnnotationMode.SHOW);
    } else {
      this.setMode(AnnotationMode.HIDE);
    }
  }

  private _commitComment(comment: UIPannelComment) {
    // this.subject$.next({
    //   type: AnnotationMessageEnum.CREATE,
    //   record: comment.record,
    // });
    if (this.storage) {
      this.storage.addAnnotation(comment.record);
    }
    comment.dirty = false;
    comment.saved = true;
  }

  // get penIsOn() {
  //   return this.mode === AnnotationMode.PEN;
  // }

  // Private and internal  after here -------------------------------------------------------------------------------------

  handleItemFocusOff(comment: UIPannelComment) {
    if (!comment.saved) {
      this.storage.addAnnotation(comment.record);
      comment.saved = true;
      comment.dirty = false;
    } else if (comment.dirty) {
      this.storage.updateAnnotation(comment.record);
      comment.dirty = false;
    }
  }

  private handleHightlightChange(newHighlight: UIPannelComment) {
    const oldHighlight: UIPannelComment = this.highlightComment;

    if (!newHighlight || newHighlight !== this.highlightComment) {
      if (this.highlightComment) {
        this.highlightComment.component.setFocusMode(
          FocusModeEnum.HIGHLIGHT_OFF
        );
      }
      this.highlightComment = newHighlight;
      if (newHighlight) {
        this.highlightComment.component.setFocusMode(
          FocusModeEnum.HIGHLIGHT_ON
        );
      }
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

  private getAnnotationPanelPos(anno: AnnotationRecord): PanelPosition {
    // if (!this.panelPositionHelper) {
    //   throw new Error(
    //     'AnnotationService: you must provide a PanelPositionHelper'
    //   );
    // }

    // TODO motive !== comment;
    const y = this.pannelPosHelper(anno);

    const pos: PanelPosition = { page: anno.mark.page, rank: 0, y, yPlot: y };
    console.log('POS ', pos);
    return pos;
  }

  private renderer(record: AnnotationRecord) {
    if (!record.mark) return;
    const page = this.pages[record.mark.page];

    const highlight =
      this.highlightComment && record.id === this.highlightComment.record.id;

    // console.log(this.highlightComment);
    // console.log(record);
    page.draw(record, highlight);
  }

  private sortComments() {
    setTimeout(() => {
      let yPlot = -1;
      this._comments.sort((a, b) => {
        if (a.pos.page > b.pos.page) return 1;
        if (a.pos.page < b.pos.page) return -1;

        // Same page
        if (a.pos.y > b.pos.y) return 1;
        if (a.pos.y < b.pos.y) return -1;

        return 0;
      });

      for (const comment of this._comments) {
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
  private rebuildCommentPostions() {
    for (const c of this._comments) {
      c.pos = this.getAnnotationPanelPos(c.record);
    }
  }

  private async initAnnotationListener() {
    // TODO destory
    this.sub = this.newRecord$.subscribe((record) => {
      const pos = this.getAnnotationPanelPos(record);
      const comment: UIPannelComment = {
        saved: false,
        dirty: true,
        pos,
        record,
      };

      this.focusComment = comment;
      this._comments.push(comment);

      // give angluar time to add to dom.
      setTimeout(() => this.sortComments());
    });
  }

  private setMode(mode: AnnotationMode) {
    this._mode = mode;
    if (
      this._mode === AnnotationMode.OFF ||
      this._mode === AnnotationMode.HIDE
    ) {
      if (this.focusComment) {
        this.focusComment.component.setFocusMode(FocusModeEnum.CLOSED);
      }
      this.focusComment = null;
    }
    this.handleHightlightChange(this.focusComment);
    this.modeSubject$.next(mode);
  }

  // Not for external use  ----------------------------------------------------------------------------------------------------------

  // This is when a user selects an comment
  _focusOnComment(comment: UIPannelComment) {
    if (this.focusComment === comment) {
      return;
    }

    this.setMode(AnnotationMode.OFF);

    if (this.focusComment) {
      this.focusComment.component.setFocusMode(FocusModeEnum.CLOSED);
    }

    this.focusComment = comment;

    if (this.focusComment) {
      this.focusComment.component.setFocusMode(FocusModeEnum.FOCUS);
    }

    this.handleHightlightChange(comment);
  }

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
        createdAt: new Date().toISOString(),
        isPrivate: this.isPrivate,
        userName: this.user.userName,
        userId: this.user.userId,
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
    if (this._mode !== AnnotationMode.HIDE) {
      this.setMode(AnnotationMode.OFF);
    }
    const ii = this._comments.findIndex((x) => x === comment);
    this._comments.splice(ii, 1);
    this.sortComments();
    const id = comment.record.id;
    delete this.annotationMap[id];
    const page = comment.pos.page;
    this._redraw(page);
  }

  _destroy() {
    for (const page of Object.keys(this.pages)) {
      this.pages[page].destroy();
    }
  }
}
