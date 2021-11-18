import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  AnnotationRecord,
  AnnotationItemType,
  AnnotationType,
  AnnotationStorage,
  AnnotationUser,
  UIPannelComment,
  AnnotationPayload,
} from './classes';

import { PageHandler } from './page-handler';
import { AUTO_SAVE_INTERVAL, SELECTION_ACTIVATE_TIME } from './constants';
import { AnnotationPositionHelper } from './annotation.position.helper';
import { AnnotationFocusHelper } from './annotation.focus.helper';
import { AnnotationRenderHelper } from './annotation.render.helper';
import { AnnotationFactory } from './annotation.factory';
import { AnnotationTextSelection } from './annotation-text-selection';
import { AnnotationImageService } from './image.service';

@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  // PDFPageVIew on eper page.
  pages: { [page: number]: PageHandler } = {};

  // This holds all the comments
  commentRecordMap: { [id: string]: AnnotationRecord } = {};
  _user: AnnotationUser = { userName: 'Guest', userId: '1234' };

  // Replies are part of the UIPannelComment
  _comments: UIPannelComment[] = [];

  // isPrivate = true;
  documentId: string;

  storage: AnnotationStorage;
  positionHelper: AnnotationPositionHelper;
  focusHelper: AnnotationFocusHelper;
  renderHelper: AnnotationRenderHelper;
  factory: AnnotationFactory;
  textHandler: AnnotationTextSelection;

  constructor(public imageService: AnnotationImageService) {
    this.positionHelper = new AnnotationPositionHelper(this);
    this.focusHelper = new AnnotationFocusHelper(this);
    this.renderHelper = new AnnotationRenderHelper(this);
    this.factory = new AnnotationFactory(this);
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
          this.commentRecordMap[record.id] = record as AnnotationRecord;
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
      this.renderHelper.redraw(null);
      if (this.storage) {
        setInterval(() => this.autoSaveAnnotations(), AUTO_SAVE_INTERVAL);
      }
    });
    // console.log('COMMENTS LOADED FROM STORE');

    this.textHandler = new AnnotationTextSelection(this);

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
    if (record.type === AnnotationItemType.COMMENT) {
      let existingRecord: AnnotationRecord = this.commentRecordMap[id];

      if (!existingRecord) {
        this.factory.addNewRecord(record, true);
        this.renderHelper.rebuildComments(null);
      } else {
        Object.assign(existingRecord, record);
      }
    } else {
      const parentId = record.parentId;
      // const commentRecord=this.commentRecordMap[parentId];
      const comment = this._comments.find(
        (item) => item.records[0].id === parentId
      );
      comment.component.updateExternalReply(record);
    }

    // this.renderHelper.renderer(record);
    this.renderHelper.rebuildComments(record);
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
    }

    this.pages[page].updateCanvas(evt.source);
    this.renderHelper.rebuildComments(page);
  }

  zoomChange(evt) {
    console.log(' ZOOM CHANGE ');
    this.renderHelper.rebuildComments(null);
  }

  isActive(): boolean {
    return this.focusHelper.mode !== AnnotationType.HIDE;
  }

  // Auto loop saves (publish button handled else where)
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
      delete this.commentRecordMap[record.id];
    }
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
