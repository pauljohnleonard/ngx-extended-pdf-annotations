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
  inputRecord: AnnotationRecord;
  windowHeightForMobile: number;
  focusmode = FocusModeEnum.CREATE;
  AnnotationComment: AnnotationComment;

  cnt = 0;

  constructor(
    public date: DateUtilService,
    public el: ElementRef,
    public annotationService: AnnotationService
  ) {}

  get hasFocus() {
    return this.annotationService.focusComment === this.comment;
  }

  handleFocusOn() {
    console.log(' handleFocusOn ');

    // if (this.hasFocus) {
    //   return;
    // }
    const lastItem = this.comment.records[this.comment.records.length - 1];
    if (lastItem.dirty || !lastItem.saved) {
      this.inputRecord = lastItem;
    } else {
      let record: AnnotationReply = {
        documentId: this.annotationService.documentId,
        type: AnnotationItemType.REPLY,
        dirty: false,
        saved: false,
        id: uuidv4(),
        parentId: this.comment.records[0].id,
        bodyValue: '',
        createdAt: new Date().toISOString(),
        userName: this.annotationService.getUser().userName,
        userId: this.annotationService.getUser().userId,
      };
      this.comment.records.push(record);
      this.inputRecord = record;
      this.inputFormControl.setValue('');
    }
    // this.hasFocus = true;
  }

  handleFocusOff() {
    const lastItem = this.comment.records[this.comment.records.length - 1];
    if (lastItem.type === AnnotationItemType.REPLY) {
      if (!lastItem.saved && (!lastItem.dirty || !lastItem.bodyValue)) {
        this.comment.records.pop();
      }
    }
    // this.hasFocus = false;
    this.inputRecord = null;
  }
  // This is responisble for setting the state of annotation when we gain focus

  // Set the mode of the item.
  // Do not call directly. Let annotation manager do it.
  setFocusMode(focusMode: FocusModeEnum) {
    this.focusmode = focusMode;
    console.log('FOCUS MODE', focusMode, this.comment);
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
    console.log(this.comment);
    this.comment.component = this;

    this.inputFormControl.valueChanges.subscribe((val) => {
      this.inputRecord.bodyValue = val;
      this.inputRecord.dirty = true;
    });

    if (!this.comment.records[0].saved) {
      this.setFocusMode(FocusModeEnum.CREATE);
      this.inputRecord = this.comment.records[0];
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
