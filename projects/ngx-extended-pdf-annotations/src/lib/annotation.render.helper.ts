import { AnnotationService } from './annotation.service';
import { AnnotationMark, AnnotationRecord, AnnotationType } from './classes';
import { PageHandler } from './page-handler';

export class AnnotationRenderHelper {
  constructor(public annotationService: AnnotationService) {}
  // if no page then redraw all

  switchHighlight(oldHighlight, newFocus) {
    setTimeout(() => {
      if (oldHighlight) {
        this.annotationService.renderHelper.redraw(oldHighlight.pos.page);
        if (newFocus && newFocus.pos.page !== oldHighlight.pos.page) {
          this.annotationService.renderHelper.redraw(newFocus.pos.page);
        }
      } else if (newFocus && newFocus.pos.page) {
        this.annotationService.renderHelper.redraw(newFocus.pos.page);
      }
    });
  }

  rebuildComments(page) {
    setTimeout(() => {
      this.annotationService.positionHelper.rebuildCommentPositions();
      this.annotationService.positionHelper.sortComments();
      setTimeout(() => this.redraw(page), 1);
    }, 1);
  }

  private renderer(record: AnnotationRecord) {
    if (!record.mark) return;

    const highlight =
      !record.noHighlight &&
      this.annotationService.focusHelper.focusComment &&
      record.id ===
        this.annotationService.focusHelper.focusComment.records[0].id;

    let pageHandler: PageHandler;
    switch (record.mark.type) {
      case AnnotationType.PEN:
        pageHandler = this.annotationService.pages[record.mark.page];
        if (pageHandler) {
          pageHandler.drawPenMark(record);
          if (highlight) {
            pageHandler.drawHighlightBox(record.mark.boundingBox);
          }
        }
        break;

      case AnnotationType.NOTE:
        pageHandler = this.annotationService.pages[record.mark.page];
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
          const pageHandler = this.annotationService.pages[pageRect.page];
          if (pageHandler) {
            pageHandler.drawTextBox(pageRect);
          }
        }
        if (highlight) {
          for (const page of textMark.pages) {
            const pageHandler = this.annotationService.pages[page];
            if (pageHandler) {
              pageHandler.drawTextHighLight(record.mark);
            }
          }
        }
    }
  }

  private redraw(page?: number) {
    // console.log(' REDRAW ', page);
    if (page !== undefined) {
      const pageHandler = this.annotationService.pages[page];
      if (pageHandler) {
        pageHandler.clear();
      }
    } else {
      for (const key of Object.keys(this.annotationService.pages)) {
        this.annotationService.pages[key].clear();
      }
    }

    for (const id of Object.keys(this.annotationService.commentRecordMap)) {
      const record = this.annotationService.commentRecordMap[id];
      if (page === undefined || (record.mark && record.mark.page === page)) {
        this.renderer(record);
      }
    }
  }
}
