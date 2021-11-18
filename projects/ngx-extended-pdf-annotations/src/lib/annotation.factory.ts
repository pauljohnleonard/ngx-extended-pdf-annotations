import { AnnotationService } from './annotation.service';
import {
  AnnotationEdge,
  AnnotationItemType,
  AnnotationMark,
  AnnotationPageRect,
  AnnotationRecord,
  AnnotationType,
  PageEvent,
  UIPannelComment,
} from './classes';
import { extractEdgesFromRects } from './combineRects';
import { setBoundingBoxOf } from './util';
import { v4 as uuidv4 } from 'uuid';

export class AnnotationFactory {
  // needsRebuild: boolean;

  constructor(public annotationService: AnnotationService) {}

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
          this.annotationService.positionHelper.findPageOfRect(rect);
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

    if (!pageRects.length) {
      return;
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
      documentId: this.annotationService.documentId,
      type: AnnotationItemType.COMMENT,
      dirty: false,
      virgin: true,
      shared: false,
      id: uuidv4(),
      bodyValue: '',
      mark,
      createdAt: new Date().toISOString(),
      userName: this.annotationService._user.userName,
      userId: this.annotationService._user.userId,
    };

    this.annotationService.focusHelper.setMode(AnnotationType.OFF);
    this.annotationService.factory.addNewRecord(record, false);
    // this.annotationService.renderHelper.renderer(record);
    this.annotationService.renderHelper.rebuildComments(null);
  }

  handlePageEvent(event: PageEvent) {
    const id = event.id;
    let record: AnnotationRecord = this.annotationService.commentRecordMap[id];
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
            documentId: this.annotationService.documentId,
            type: AnnotationItemType.COMMENT,
            dirty: true,
            virgin: true,
            shared: false,
            id: event.id,
            bodyValue: '',
            mark,
            createdAt: new Date().toISOString(),
            userName: this.annotationService._user.userName,
            userId: this.annotationService._user.userId,
            noHighlight: true,
          };

          setBoundingBoxOf(record, event);
          this.addNewRecord(record, false);
          break;

        case AnnotationType.NOTE:
          type = event.mode;

          mark = {
            page: event.page,
            pos: event.pos,
            type,
          };

          record = {
            documentId: this.annotationService.documentId,
            type: AnnotationItemType.COMMENT,
            dirty: true,
            virgin: true,
            shared: false,
            id: event.id,
            bodyValue: '',
            mark,
            createdAt: new Date().toISOString(),
            userName: this.annotationService._user.userName,
            userId: this.annotationService._user.userId,
          };

          setBoundingBoxOf(record, event);
          this.addNewRecord(record, false);
          setTimeout(() =>
            this.annotationService.focusHelper.setMode(AnnotationType.OFF)
          );
          break;
      }
    } else {
      record.dirty = true;
      if (event.event === 'MOUSE_UP') {
        record.noHighlight = false;
        this.annotationService.focusHelper.setMode(AnnotationType.OFF);
      }
      setBoundingBoxOf(record, event);
      this.annotationService.focusHelper._handleHighlightRecord(record);
    }

    this.annotationService.renderHelper.redraw(event.page);
    // this.annotationService.renderHelper.renderer(record);
  }

  addNewRecord(record: AnnotationRecord, external: boolean): boolean {
    if (this.annotationService.commentRecordMap[record.id]) return false;
    this.annotationService.commentRecordMap[record.id] = record;

    if (record.type === AnnotationItemType.COMMENT) {
      const pos =
        this.annotationService.positionHelper.getAnnotationPanelPos(record);
      const comment: UIPannelComment = {
        pos,
        records: [record],
      };
      this.annotationService._comments.push(comment);
      if (!external) this.annotationService.focusHelper.setFocus(comment);
    }
    return true;
  }

  async deleteComment(comment: UIPannelComment) {
    for (const record of comment.records) {
      record.deleted = true;
      await this.annotationService.saveRecord(record);
    }

    this.annotationService.focusHelper.setFocus(null);

    const ii = this.annotationService._comments.findIndex((x) => x === comment);
    this.annotationService._comments.splice(ii, 1);
    this.annotationService.positionHelper.sortComments();
    const id = comment.records[0].id;
    delete this.annotationService.commentRecordMap[id];
    const page = comment.pos.page;
    this.annotationService.renderHelper.redraw(page);
  }
}
