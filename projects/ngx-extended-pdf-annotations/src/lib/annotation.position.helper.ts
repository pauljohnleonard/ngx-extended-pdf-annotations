import { AnnotationService } from './annotation.service';
import { AnnotationPageRect, AnnotationRecord, PanelPosition } from './classes';
import { PageHandler } from './page-handler';

export class AnnotationPositionHelper {
  // needsRebuild: boolean;

  constructor(public annotationService: AnnotationService) {
    // setInterval(() => {
    //   if (this.needsRebuild) {
    //     this._rebuildCommentPostions();
    //     this.needsRebuild = false;
    //   }
    // }, 100);
  }

  // rebuildCommentPositions() {
  //   this.needsRebuild = true;
  // }

  // rebuild comment positions
  // We do this if the zoome changes
  rebuildCommentPositions() {
    for (const c of this.annotationService._comments) {
      c.pos = this.getAnnotationPanelPos(c.records[0]);
    }
  }

  getAnnotationPanelPos(anno: AnnotationRecord): PanelPosition {
    const y = this.pannelPosHelper(anno);
    const pos: PanelPosition = { page: anno.mark.page, rank: 0, y, yPlot: y };
    return pos;
  }

  private pannelPosHelper(record: AnnotationRecord) {
    const page = this.annotationService.pages[record.mark.page];
    if (!page) return 0;
    return page.getAnnotationPanelPos(record);
  }

  findPageOfRect(rect: DOMRect): AnnotationPageRect {
    for (const key of Object.keys(this.annotationService.pages)) {
      const page: PageHandler = this.annotationService.pages[key];
      const pageRect = page.mapToPageRect(rect);
      if (pageRect) {
        return pageRect;
      }
    }
    return null;
  }

  sortComments() {
    setTimeout(() => {
      let yPlot = -1;
      this.annotationService._comments.sort((a, b) => {
        if (!a.pos && !b.pos) return 0;
        if (!a.pos && b.pos) return -1;
        if (a.pos && !b.pos) return 0;

        if (a.pos.page > b.pos.page) return 1;
        if (a.pos.page < b.pos.page) return -1;

        // Same page
        if (a.pos.y > b.pos.y) return 1;
        if (a.pos.y < b.pos.y) return -1;

        return 0;
      });

      for (const comment of this.annotationService._comments) {
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
}
