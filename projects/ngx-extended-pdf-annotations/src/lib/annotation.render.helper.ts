import { AnnotationService } from './annotation.service';
import { AnnotationMark, AnnotationRecord, AnnotationType } from './classes';
import { PageHandler } from './page-handler';

export class AnnotationRenderHelper {
  constructor(public annotationService: AnnotationService) {}
  // if no page then redraw all
  _redraw(page?: number) {
    console.log(' REDRAW ', page);
    if (page !== undefined) {
      const pageHandler = this.annotationService.pages[page];
      pageHandler.clear();
    } else {
      for (const key of Object.keys(this.annotationService.pages)) {
        this.annotationService.pages[key].clear();
      }
    }

    for (const id of Object.keys(this.annotationService.annotationMap)) {
      const record = this.annotationService.annotationMap[id];
      if (page === undefined || (record.mark && record.mark.page === page)) {
        this.renderer(record);
      }
    }
  }

  renderer(record: AnnotationRecord) {
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
}
