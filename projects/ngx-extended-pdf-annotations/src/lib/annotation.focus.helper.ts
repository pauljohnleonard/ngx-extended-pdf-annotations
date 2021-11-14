import { Subject } from 'rxjs';
import { AnnotationService } from './annotation.service';
import {
  AnnotationControlEvent,
  AnnotationRecord,
  AnnotationType,
  FocusModeEnum,
  UIPannelComment,
} from './classes';

export class AnnotationFocusHelper {
  private _focusComment: UIPannelComment = null;
  private _mode = AnnotationType.OFF;
  public modeSubject$ = new Subject<AnnotationType>();

  get mode() {
    return this._mode;
  }
  get focusComment(): UIPannelComment {
    return this._focusComment;
  }
  constructor(public annotationService: AnnotationService) {}

  focusOnComment(newFocus: UIPannelComment) {
    const oldHighlight: UIPannelComment = this._focusComment;
    console.log(
      `Hightlight change   ${
        oldHighlight ? oldHighlight.records[0].id : 'NONE'
      }   ${newFocus ? newFocus.records[0].id : 'NONE'}`
    );

    if (!newFocus || newFocus !== this._focusComment) {
      if (this._focusComment) {
        this._focusComment.component.setFocusMode(FocusModeEnum.HIGHLIGHT_OFF);
      }
      console.log(
        ' Set highlight ',
        newFocus ? newFocus.records[0].id : ' NONE'
      );

      this._focusComment = newFocus;
      if (newFocus) {
        this._focusComment.component.setFocusMode(FocusModeEnum.HIGHLIGHT_ON);
      }
      this.annotationService.positionHelper.sortComments();
    }

    setTimeout(() => {
      if (oldHighlight) {
        this.annotationService.renderHelper._redraw(oldHighlight.pos.page);
        if (newFocus && newFocus.pos.page !== oldHighlight.pos.page) {
          this.annotationService.renderHelper._redraw(newFocus.pos.page);
        }
      } else if (newFocus && newFocus.pos.page) {
        this.annotationService.renderHelper._redraw(newFocus.pos.page);
      }
    });
  }

  setMode(mode: AnnotationType) {
    this._mode = mode;
    if (
      this._mode === AnnotationType.OFF ||
      this._mode === AnnotationType.HIDE
    ) {
      if (this.focusComment) {
        this.focusComment.component.setFocusMode(FocusModeEnum.CLOSED);
      }
      this._focusComment = null;
    }
    this.focusOnComment(this.focusComment);
    this.modeSubject$.next(mode);
  }

  handleControlEvent(evt: AnnotationControlEvent) {
    this.focusOnComment(null);
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

  pdfLoaded(evt) {
    console.log(' PDF LOADED ');
    this.modeSubject$.next(AnnotationType.READY);
  }

  _handleHighlightRecord(record: AnnotationRecord) {
    const parentId = record.parentId || record.id;

    const comment = this.annotationService._comments.find(
      (x) => x.records[0].id === parentId
    );

    if (comment) {
      this.focusOnComment(comment);
    }
  }

  setFocus(comment: UIPannelComment) {
    if (!comment) {
      if (this._mode !== AnnotationType.HIDE) {
        this.setMode(AnnotationType.OFF);
      }
    } else {
      this._focusComment = comment;

      //
      // give angluar time to add to dom.
      setTimeout(() => {
        this.annotationService.positionHelper.sortComments();
        this.focusOnComment(comment);
      });
    }
  }
}
