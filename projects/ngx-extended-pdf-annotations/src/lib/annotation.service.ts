import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  AnnotationRecord,
  AnnotationItemType,
  AnnotationType,
  AnnotationStorage,
  AnnotationUser,
  PageEvent,
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
import { AUTO_SAVE_INTERVAL } from './constants';
import { AnnotationPositionHelper } from './annotation.position.helper';
import { AnnotationFocusHelper } from './annotation.focus.helper';
import { AnnotationRenderHelper } from './annotation.render.helper';
@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  pages: { [page: number]: PageHandler } = {}; // PDFPageVIew
  annotationMap: { [id: string]: AnnotationRecord } = {};
  _user: AnnotationUser = { userName: 'Guest', userId: '1234' };

  // private highlightComment: UIPannelComment = null;

  public textLayer$ = new BehaviorSubject<boolean>(false);
  _comments: UIPannelComment[] = [];
  _selections: DOMRectList[];

  storage: AnnotationStorage;

  // isPrivate = true;
  documentId: string;
  noteImg: HTMLImageElement;
  positionHelper: AnnotationPositionHelper;
  focusHelper: AnnotationFocusHelper;
  renderHelper: AnnotationRenderHelper;
  // public subject$ = new Subject<AnnotationMessage>();

  constructor() {
    this.noteImg = new Image();
    this.noteImg.src =
      '/assets/ngx-extended-pdf-annotations/comment_yellow.svg';

    this.positionHelper = new AnnotationPositionHelper(this);
    this.focusHelper = new AnnotationFocusHelper(this);
    this.renderHelper = new AnnotationRenderHelper(this);
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
    if (this.storage) {
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
    }
    setTimeout(() => {
      this.zoomChange(null);
      this.renderHelper._redraw();
      if (this.storage) {
        setInterval(() => this.autoSaveAnnotations(), AUTO_SAVE_INTERVAL);
      }
    });
    // console.log('COMMENTS LOADED FROM STORE');

    this.initTextHandler();

    if (this.storage) {
      this.storage.update$.subscribe((payload) => {
        console.log(' annotation update ', payload);
        this.handleRemoteUpdate(payload);
      });
    }
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
      Object.assign(existingRecord, record);
    }

    this.renderHelper.renderer(record);
  }

  initTextHandler() {
    window.addEventListener('mouseup', () => {
      if (this.focusHelper.mode === AnnotationType.TEXT) {
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
        const pageRect: AnnotationPageRect =
          this.positionHelper.findPageOfRect(rect);
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

    this.focusHelper.setMode(AnnotationType.OFF);
    this._addNewRecord(record);
    this.renderHelper.renderer(record);
  }

  getMode() {
    return this.focusHelper.mode;
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
        this.renderHelper._redraw(page);
      });
    }
  }

  zoomChange(evt) {
    console.log(' ZOOM CHANGE ');
    setTimeout(() => {
      this.positionHelper.rebuildCommentPostions();
      this.positionHelper.sortComments();
      setTimeout(() => this.renderHelper._redraw());
    });
  }

  // Public interface -----------------------------------------------------------------------------------------

  isActive(): boolean {
    return this.focusHelper.mode !== AnnotationType.HIDE;
  }

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
            noHighlight: true,
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
          setTimeout(() => this.focusHelper.setMode(AnnotationType.OFF));
          break;
      }
    } else {
      record.dirty = true;
      if (event.event === 'MOUSE_UP') {
        record.noHighlight = false;
        this.focusHelper.setMode(AnnotationType.OFF);
      }
      setBoundingBoxOf(record, event);
      this.focusHelper._handleHighlightRecord(record);
    }

    this.renderHelper.renderer(record);
  }

  _addNewRecord(record: AnnotationRecord): boolean {
    if (this.annotationMap[record.id]) return false;
    this.annotationMap[record.id] = record;

    const pos = this.positionHelper.getAnnotationPanelPos(record);
    const comment: UIPannelComment = {
      pos,
      records: [record],
    };
    this._comments.push(comment);
    this.focusHelper.setFocus(comment);

    return true;
  }

  async _deleteComment(comment: UIPannelComment) {
    for (const record of comment.records) {
      record.deleted = true;
      await this.saveRecord(record);
    }

    this.focusHelper.setFocus(null);

    const ii = this._comments.findIndex((x) => x === comment);
    this._comments.splice(ii, 1);
    this.positionHelper.sortComments();
    const id = comment.records[0].id;
    delete this.annotationMap[id];
    const page = comment.pos.page;
    this.renderHelper._redraw(page);
  }

  _destroy() {
    for (const page of Object.keys(this.pages)) {
      this.pages[page].destroy();
    }
  }

  pdfLoaded(evt) {
    this.focusHelper.modeSubject$.next(AnnotationType.READY);
  }
}
