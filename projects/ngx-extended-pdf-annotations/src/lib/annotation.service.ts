import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  AnnotationRecord,
  AnnotationControlEvent,
  AnnotationItemType,
  AnnotationMark,
  AnnotationMode,
  AnnotationComment,
  AnnotationReply,
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
  private annotationMap: { [id: string]: AnnotationComment } = {};
  private _user: AnnotationUser = { userName: 'Guest', userId: '1234' };
  focusComment: UIPannelComment = null;
  private highlightComment: UIPannelComment = null;
  private _mode = AnnotationMode.OFF;

  _comments: UIPannelComment[] = [];

  public modeSubject$ = new Subject<AnnotationMode>();

  storage: AnnotationStorage;

  // isPrivate = true;
  documentId: string;
  // public subject$ = new Subject<AnnotationMessage>();

  constructor() {}

  async initialize({
    user,
    storage,
    documentId,
  }: {
    user: AnnotationUser;
    storage: AnnotationStorage;
    documentId: string;
  }) {
    this.storage = storage;
    this._user = user;
    this.documentId = documentId;
    const records = await this.storage.fetchDocument(
      documentId,
      this._user.userId
    );

    console.log(` Loaded  ${records.length}  records`);
    const commentRecords: {
      [id: string]: AnnotationRecord[];
    } = {};

    for (const record of records) {
      if (record.deleted) {
        continue;
      }
      if (record.type === AnnotationItemType.COMMENT) {
        commentRecords[record.id] = [record];
        this.annotationMap[record.id] = record as AnnotationComment;
      }
    }

    for (const record of records) {
      if (record.deleted) {
        continue;
      }
      if (record.type === AnnotationItemType.REPLY) {
        if (!commentRecords[(record as AnnotationReply).parentId]) {
          continue;
        }
        commentRecords[(record as AnnotationReply).parentId].push(record);
      }
    }

    for (const key of Object.keys(commentRecords)) {
      const records = commentRecords[key];

      // const pos = this.getAnnotationPanelPos(records[0] as AnnotationComment);

      this._comments.push({ records });
    }
    setTimeout(() => {
      this.zoomChange(null);
      this._redraw();
      this.startAutoSave();
    });
    // console.log('COMMENTS LOADED FROM STORE');
  }

  saveAllComments() {
    for (const comment of this._comments) {
      this.saveComment(comment);
    }
  }
  startAutoSave() {
    setInterval(() => {
      this.saveAllComments();
    }, 5000);
  }

  handleControlEvent(evt: AnnotationControlEvent) {
    switch (evt.type) {
      case AnnotationMode.TOGGLE:
        if (this._mode === AnnotationMode.HIDE) {
          this.setMode(AnnotationMode.SHOW);
        } else {
          this.setMode(AnnotationMode.HIDE);
        }
        break;
      case AnnotationMode.PEN:
      case AnnotationMode.TEXT:
        if (!evt.val) {
          this.setMode(AnnotationMode.OFF);
        } else {
          this.setMode(evt.type);
        }
        break;
    }
  }

  getMode() {
    return this._mode;
  }

  getUser() {
    return this._user;
  }
  // Interface to ngx-extended-pdf-viewer -----------------------------------------------------------------------------------------

  pageRendered(evt) {
    console.log(' PAGE RENDER  ', evt.pageNumber);
    const page = evt.pageNumber;
    if (!this.pages[page]) {
      const pageHandler = new PageHandler(evt.source, page, this);
      this.pages[page] = pageHandler;
      this.zoomChange(null);
    } else {
      this.pages[page].updateCanvas(evt.source);
      setTimeout(() => {
        this.zoomChange(null);
        this._redraw(page);
      });
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
    console.log(' PDF LOADED ');
    this.modeSubject$.next(AnnotationMode.READY);
  }

  private pannelPosHelper(record: AnnotationComment) {
    const page = this.pages[record.mark.page];
    if (!page) return 0;
    return page.getAnnotationPanelPos(record);
  }

  // Public interface -----------------------------------------------------------------------------------------

  isActive(): boolean {
    return this._mode !== AnnotationMode.HIDE;
  }

  // Private and internal  after here -------------------------------------------------------------------------------------

  // If we lose focus then save all the data.
  async handleItemFocusOff(comment: UIPannelComment) {
    await this.saveComment(comment);
  }

  // Auto loop saves (publish button handled else where)
  async saveComment(comment: UIPannelComment) {
    for (const record of comment.records) {
      if (this.storage) {
        if (!record.published && record.dirty) {
          record.dirty = false;
          record.virgin = false;
          await this.storage.saveAnnotation(record);
        }
      }
    }
  }

  // Forcefully save a record.
  async saveRecord(record: AnnotationRecord) {
    if (this.storage) {
      record.dirty = false;
      record.virgin = false;
      await this.storage.saveAnnotation(record);
    }
  }

  private handleHighlightChange(newHighlight: UIPannelComment) {
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

  private getAnnotationPanelPos(anno: AnnotationComment): PanelPosition {
    // if (!this.panelPositionHelper) {
    //   throw new Error(
    //     'AnnotationService: you must provide a PanelPositionHelper'
    //   );
    // }

    // TODO motive !== comment;
    const y = this.pannelPosHelper(anno);

    const pos: PanelPosition = { page: anno.mark.page, rank: 0, y, yPlot: y };
    // console.log('POS ', pos);
    return pos;
  }

  private renderer(record: AnnotationComment) {
    if (!record.mark) return;

    const highlight =
      this.highlightComment &&
      record.id === this.highlightComment.records[0].id;

    const page = this.pages[record.mark.page];

    if (page) {
      page.draw(record, highlight);
    }
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
      c.pos = this.getAnnotationPanelPos(c.records[0] as AnnotationComment);
    }
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
    this.handleHighlightChange(this.focusComment);
    this.modeSubject$.next(mode);
  }

  // Not for external use  ----------------------------------------------------------------------------------------------------------

  // This is when a user selects an comment
  _focusOnComment(comment: UIPannelComment) {
    if (this.focusComment === comment) {
      this.modeSubject$.next(AnnotationMode.OFF);
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

    this.handleHighlightChange(comment);
  }

  _handlePageEvent(event: PageEvent) {
    const id = event.id;
    // console.log('PAGE EVEnt  : ', event);
    let record: AnnotationComment = this.annotationMap[id];
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
        documentId: this.documentId,
        type: AnnotationItemType.COMMENT,
        dirty: false,
        virgin: true,
        published: false,
        id: event.id,
        bodyValue: '',
        mark,
        createdAt: new Date().toISOString(),
        userName: this._user.userName,
        userId: this._user.userId,
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

  _addNewRecord(record: AnnotationComment): boolean {
    if (this.annotationMap[record.id]) return false;
    this.annotationMap[record.id] = record;

    const pos = this.getAnnotationPanelPos(record);
    const comment: UIPannelComment = {
      pos,
      records: [record],
    };

    this.focusComment = comment;
    this._comments.push(comment);

    // give angluar time to add to dom.
    setTimeout(() => this.sortComments());

    return true;
  }

  // _layoutChange() {}

  async _deleteComment(comment: UIPannelComment) {
    for (const record of comment.records) {
      record.deleted = true;
      await this.saveRecord(record);
    }

    if (this._mode !== AnnotationMode.HIDE) {
      this.setMode(AnnotationMode.OFF);
    }
    const ii = this._comments.findIndex((x) => x === comment);
    this._comments.splice(ii, 1);
    this.sortComments();
    const id = comment.records[0].id;
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
