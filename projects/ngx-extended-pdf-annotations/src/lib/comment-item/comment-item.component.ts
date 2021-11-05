import { TOUCH_BUFFER_MS } from '@angular/cdk/a11y/input-modality/input-modality-detector';
import {
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { AnnotationService } from '../annotation.service';
import {
  AnnotationRecord,
  AnnotationItemType,
  AnnotationComment,
  AnnotationReply,
  FocusModeEnum,
  UIPanelItemIterface,
  UIPannelComment,
} from '../classes';
import { v4 as uuidv4 } from 'uuid';

import { DateUtilService } from '../date-util.service';

enum TextItemType {
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
}
class TextItem {
  bodyText: string;
  type: TextItemType;
}

@Component({
  selector: 'ngx-extended-pdf-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  // encapsulation: ViewEncapsulation.ShadowDom,
})
export class CommentItemComponent implements OnInit, UIPanelItemIterface {
  @ViewChild(MatInput) messageInput: MatInput;
  @Input() comment: UIPannelComment;

  isMobileScreen = false;
  FocusMode = FocusModeEnum;
  AnnotationItemType = AnnotationItemType;
  inputFormControl = new FormControl({ value: '', disabled: false });
  _inputRecord: AnnotationRecord;
  windowHeightForMobile: number;
  focusmode = FocusModeEnum.CREATE;
  AnnotationComment: AnnotationComment;

  cnt = 0;

  constructor(
    public date: DateUtilService,
    public el: ElementRef,
    public annotationService: AnnotationService
  ) {}

  get inputRecord() {
    return (
      this.annotationService.focusComment === this.comment && this._inputRecord
    );
  }

  initInput() {
    if (!this._inputRecord) {
      this.inputFormControl.setValue('');
    } else {
      this.inputFormControl.setValue(this._inputRecord.bodyValue);
    }
  }

  get hasFocus() {
    return this.annotationService.focusComment === this.comment;
  }

  handleFocusOn() {
    const lastItem = this.comment.records[this.comment.records.length - 1];

    if (lastItem.userId === this.annotationService.getUser().userId) {
      this._inputRecord = lastItem;
    } else {
      let record: AnnotationReply = {
        documentId: this.annotationService.documentId,
        type: AnnotationItemType.REPLY,
        dirty: false,
        virgin: true,
        published: false,
        id: uuidv4(),
        parentId: this.comment.records[0].id,
        bodyValue: '',
        createdAt: new Date().toISOString(),
        userName: this.annotationService.getUser().userName,
        userId: this.annotationService.getUser().userId,
      };
      this.comment.records.push(record);
      this._inputRecord = record;
    }
    this.initInput();
  }

  toogleVisibility() {
    this.comment.records[0].published = !this.comment.records[0].published;
    this.comment.records[0].dirty = true;
    this.annotationService.saveComment(this.comment);
  }

  handleFocusOff() {
    const lastItem = this.comment.records[this.comment.records.length - 1];
    if (lastItem.type === AnnotationItemType.REPLY) {
      if (lastItem.virgin && (!lastItem.dirty || !lastItem.bodyValue)) {
        this.comment.records.pop();
      }
    }
    // this.hasFocus = false;
    this._inputRecord = null;
    this.initInput();
  }
  // This is responisble for setting the state of annotation when we gain focus

  async publishItem(record: AnnotationRecord) {
    record.published = true;
    record.dirty = true;
    await this.annotationService.saveRecord(record);
  }

  getPublishToolTip(item: AnnotationRecord): string {
    if (item.published) {
      if (item.dirty) {
        return 'Publish your edits';
      } else {
        return 'Comment is public';
      }
    } else {
      if (item.dirty) {
        return 'Publish this comment to make publicly visible';
      } else {
        return 'No edits to save.';
      }
    }
  }

  // Set the mode of the item.
  // Do not call directly. Let annotation manager do it.
  setFocusMode(focusMode: FocusModeEnum) {
    this.focusmode = focusMode;
    // console.log('FOCUS MODE', focusMode, this.comment);
    switch (focusMode) {
      case FocusModeEnum.CREATE:
      case FocusModeEnum.FOCUS:
      case FocusModeEnum.HIGHLIGHT_ON:
        this.handleFocusOn();
        break;
      default:
        this.handleFocusOff();
        this.annotationService.handleItemFocusOff(this.comment);
    }
  }

  clicked() {
    // this.comment.editing = true;
    this.annotationService._focusOnComment(this.comment);
  }

  ngOnInit(): void {
    // console.log(this.comment);
    this.comment.component = this;

    this.inputFormControl.valueChanges.subscribe((val) => {
      if (this._inputRecord.bodyValue !== val) {
        this._inputRecord.dirty = true;
        this._inputRecord.bodyValue = val;
      }
    });

    if (this.comment.records[0].virgin) {
      this.setFocusMode(FocusModeEnum.CREATE);
      this._inputRecord = this.comment.records[0];
      this.initInput();
    }
  }

  getHeight(): number {
    const h = this.el.nativeElement.firstChild.clientHeight;
    return h;
  }

  truncateMessage(message: string) {
    const maxLength = 50;
    message = message.trim();
    const firstNewLineIndex = message.indexOf('\n');
    if (firstNewLineIndex > 0) {
      message = message.slice(0, firstNewLineIndex) + '...';
    }

    if (message.length > maxLength) {
      return message.slice(0, maxLength) + '...';
    } else {
      return message;
    }
  }

  clearMessage() {
    this.inputFormControl.setValue('');
  }
}
