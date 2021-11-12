import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import {
  AnnotationRecord,
  AnnotationControlEvent,
  AnnotationItemType,
  AnnotationType,
  AnnotationStorage,
  AnnotationUser,
  FocusModeEnum,
  PageEvent,
  PanelPosition,
  UIPannelComment,
  AnnotationPageRect,
  AnnotationMark,
  AnnotationEdge,
  AnnotationPayload,
} from './classes';

import { PageHandler } from './page-handler';
import { setBoundingBoxOf } from './util';
import { v4 as uuidv4 } from 'uuid';
import { extractEdgesFromRects } from './combineRects';
@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  private pages: { [page: number]: PageHandler } = {}; // PDFPageVIew
  private annotationMap: { [id: string]: AnnotationRecord } = {};
  _user: AnnotationUser = { userName: 'Guest', userId: '1234' };
  focusComment: UIPannelComment = null;
  private highlightComment: UIPannelComment = null;
  private _mode = AnnotationType.OFF;
  public textLayer$ = new BehaviorSubject<boolean>(false);
  _comments: UIPannelComment[] = [];
  _selections: DOMRectList[];

  public modeSubject$ = new Subject<AnnotationType>();

  storage: AnnotationStorage;

  // isPrivate = true;
  documentId: string;
  noteImg: HTMLImageElement;
  // public subject$ = new Subject<AnnotationMessage>();

  constructor() {
    this.noteImg = new Image();
    this.noteImg.src =
      '/assets/ngx-extended-pdf-annotations/comment_yellow.svg';
  }

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
        this.annotationMap[record.id] = record as AnnotationRecord;
      }
    }

    for (const record of records) {
      if (record.deleted) {
        continue;
      }
      if (record.type === AnnotationItemType.REPLY) {
        if (!commentRecords[(record as AnnotationRecord).parentId]) {
          continue;
        }
        commentRecords[(record as AnnotationRecord).parentId].push(record);
      }
    }

    for (const key of Object.keys(commentRecords)) {
      const records = commentRecords[key];

      // const pos = this.getAnnotationPanelPos(records[0] as AnnotationRecord);

      this._comments.push({ records });
    }
    setTimeout(() => {
      this.zoomChange(null);
      this._redraw();
      this.startAutoSave();
    });
    // console.log('COMMENTS LOADED FROM STORE');

    this.initTextHandler();

    this.storage.update$.subscribe((payload) => {
      console.log(' annotation update ', payload);
      this.handleRemoteUpdate(payload);
    });
  }

  handleRemoteUpdate(payload: AnnotationPayload) {
    const id = payload.record.id;
    let record = payload.record;
    // stop any silly saving of this new record.
    record.dirty = false;
    let existingRecord: AnnotationRecord = this.annotationMap[id];
    if (!existingRecord) {
      this._addNewRecord(record);
    } else {
      this.updateRecord(existingRecord, record);
    }

    this.renderer(record);
  }

  updateRecord(existing, record) {
    Object.assign(existing, record);
  }

  // if no page then redraw all

  startAutoSave() {
    setInterval(() => this.autoSaveAnnotations(), 500);
  }

  initTextHandler() {
    window.addEventListener('mouseup', () => {
      if (this._mode === AnnotationType.TEXT) {
        this.createTextAnnotation();
      }
    });
  }

  createTextAnnotation() {
    const pageRects: AnnotationPageRect[] = [];
    const selection = document.getSelection();
    const rangeCount = selection.rangeCount;
    let page;
    let pos;

    const pageMap = {};

    for (let i = 0; i < rangeCount; i++) {
      const range = selection.getRangeAt(i);
      let rects = range.getClientRects();

      for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        const pageRect: AnnotationPageRect = this._findPageOfRect(rect);
        if (!pageRect) {
          continue;
        }

        pageMap[pageRect.page] = true;

        if (!page) {
          page = pageRect.page;
          pos = pageRect.pos1;
        }
        pageRects.push(pageRect);
      }
    }

    const pages = Object.keys(pageMap).map((page) => +page);

    const edges: AnnotationEdge[] = extractEdgesFromRects(pageRects);

    const mark: AnnotationMark = {
      page,
      pos,
      type: AnnotationType.TEXT,
      pageRects,
      edges,
      pages,
    };

    let record: AnnotationRecord = {
      documentId: this.documentId,
      type: AnnotationItemType.COMMENT,
      dirty: false,
      virgin: true,
      shared: false,
      id: uuidv4(),
      bodyValue: '',
      mark,
      createdAt: new Date().toISOString(),
      userName: this._user.userName,
      userId: this._user.userId,
    };

    this.setMode(AnnotationType.OFF);
    this._addNewRecord(record);
    this.renderer(record);
  }

  _findPageOfRect(rect: DOMRect): AnnotationPageRect {
    for (const key of Object.keys(this.pages)) {
      const page: PageHandler = this.pages[key];
      const pageRect = page.mapToPageRect(rect);
      if (pageRect) {
        return pageRect;
      }
    }
    return null;
  }

  handleControlEvent(evt: AnnotationControlEvent) {
    switch (evt.type) {
      case AnnotationType.TOGGLE:
        if (this._mode === AnnotationType.HIDE) {
          this.setMode(AnnotationType.SHOW);
        } else {
          this.setMode(AnnotationType.HIDE);
        }
        break;
      case AnnotationType.PEN:
      case AnnotationType.TEXT:
      case AnnotationType.NOTE:
        if (!evt.val) {
          this.setMode(AnnotationType.OFF);
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
    this.modeSubject$.next(AnnotationType.READY);
  }

  private pannelPosHelper(record: AnnotationRecord) {
    const page = this.pages[record.mark.page];
    if (!page) return 0;
    return page.getAnnotationPanelPos(record);
  }

  // Public interface -----------------------------------------------------------------------------------------

  isActive(): boolean {
    return this._mode !== AnnotationType.HIDE;
  }

  // Private and internal  after here -------------------------------------------------------------------------------------

  // If we lose focus then save all the data.
  // async handleItemFocusOff(comment: UIPannelComment) {
  //   await this.saveComment(comment);
  // }

  // // Auto loop saves (publish button handled else where)
  async autoSaveAnnotations() {
    let savedCnt = 0;
    for (const comment of this._comments) {
      for (const record of comment.records) {
        if (this.storage) {
          if (record.dirty) {
            record.dirty = false;
            record.virgin = false;
            savedCnt++;
            await this.storage.updateAnnotation(record);
          }
        }
      }
    }
    if (savedCnt) {
      console.log(` autosaved ${savedCnt} records`);
    }
  }

  // Forcefully save a record.
  async saveRecord(record: AnnotationRecord) {
    if (this.storage) {
      record.dirty = false;
      record.virgin = false;
      await this.storage.updateAnnotation(record);
    }
    if (record.type === AnnotationItemType.COMMENT && record.deleted) {
      delete this.annotationMap[record.id];
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

  private getAnnotationPanelPos(anno: AnnotationRecord): PanelPosition {
    const y = this.pannelPosHelper(anno);
    const pos: PanelPosition = { page: anno.mark.page, rank: 0, y, yPlot: y };
    return pos;
  }

  private renderer(record: AnnotationRecord) {
    if (!record.mark) return;

    const highlight =
      this.highlightComment &&
      record.id === this.highlightComment.records[0].id;

    let pageHandler: PageHandler;
    switch (record.mark.type) {
      case AnnotationType.PEN:
        pageHandler = this.pages[record.mark.page];
        if (pageHandler) {
          pageHandler.drawPenMark(record);
          if (highlight) {
            pageHandler.drawHighlightBox(record.mark.boundingBox);
          }
        }
        break;

      case AnnotationType.NOTE:
        pageHandler = this.pages[record.mark.page];
        if (pageHandler) {
          pageHandler.drawNoteMark(record);
          if (highlight) {
            pageHandler.drawNoteHighLight(record);
          }
        }
        break;

      case AnnotationType.TEXT:
        const textMark: AnnotationMark = record.mark;

        for (const pageRect of textMark.pageRects) {
          const pageHandler = this.pages[pageRect.page];
          if (pageHandler) {
            pageHandler.drawTextBox(pageRect);
          }
        }
        if (highlight) {
          for (const page of textMark.pages) {
            const pageHandler = this.pages[page];
            if (pageHandler) {
              pageHandler.drawTextHighLight(record.mark);
            }
          }
        }
    }
  }

  sortComments() {
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
      c.pos = this.getAnnotationPanelPos(c.records[0] as AnnotationRecord);
    }
  }

  private setMode(mode: AnnotationType) {
    this._mode = mode;
    if (
      this._mode === AnnotationType.OFF ||
      this._mode === AnnotationType.HIDE
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
      this.modeSubject$.next(AnnotationType.OFF);
      return;
    }

    this.setMode(AnnotationType.OFF);

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
    let record: AnnotationRecord = this.annotationMap[id];
    if (!record) {
      let type: AnnotationType;
      let mark: AnnotationMark;
      switch (event.mode) {
        case AnnotationType.PEN:
          type = event.mode;

          mark = {
            page: event.page,
            path: event.path,
            type,
          };

          record = {
            documentId: this.documentId,
            type: AnnotationItemType.COMMENT,
            dirty: true,
            virgin: true,
            shared: false,
            id: event.id,
            bodyValue: '',
            mark,
            createdAt: new Date().toISOString(),
            userName: this._user.userName,
            userId: this._user.userId,
          };

          setBoundingBoxOf(record, event);
          this._addNewRecord(record);
          break;

        case AnnotationType.NOTE:
          type = event.mode;

          mark = {
            page: event.page,
            pos: event.pos,
            type,
          };

          record = {
            documentId: this.documentId,
            type: AnnotationItemType.COMMENT,
            dirty: true,
            virgin: true,
            shared: false,
            id: event.id,
            bodyValue: '',
            mark,
            createdAt: new Date().toISOString(),
            userName: this._user.userName,
            userId: this._user.userId,
          };

          setBoundingBoxOf(record, event);
          this._addNewRecord(record);
          setTimeout(() => this.setMode(AnnotationType.OFF));
          break;
      }
    } else {
      record.dirty = true;
      setBoundingBoxOf(record, event);
    }

    this.renderer(record);
  }

  // if no page then redraw all
  _redraw(page?: number) {
    if (page !== undefined) {
      const pageHandler = this.pages[page];
      pageHandler.clear();
    } else {
      for (const key of Object.keys(this.pages)) {
        this.pages[key].clear();
      }
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

    if (this._mode !== AnnotationType.HIDE) {
      this.setMode(AnnotationType.OFF);
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
