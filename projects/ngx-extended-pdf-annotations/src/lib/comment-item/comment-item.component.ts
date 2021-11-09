import { TOUCH_BUFFER_MS } from '@angular/cdk/a11y/input-modality/input-modality-detector';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { AnnotationService } from '../annotation.service';
import {
  AnnotationRecord,
  AnnotationItemType,
  FocusModeEnum,
  UIPanelItemIterface,
  AnnotationType,
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
  AnnotationType = AnnotationType;
  cnt = 0;
  editing = false;

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
      this.inputFormControl.markAsPristine();
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
      let record: AnnotationRecord = {
        documentId: this.annotationService.documentId,
        type: AnnotationItemType.REPLY,
        dirty: false,
        virgin: true,
        shared: this.comment.records.length > 0,
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

  toogleVisibility(item: AnnotationRecord) {
    item.shared = !item.shared;
    item.dirty = true;
    this.annotationService.saveRecord(item);
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
    this.editing = false;
    this.initInput();
  }

  // This is responisble for setting the state of annotation when we gain focus

  // async publishItem(record: AnnotationRecord) {
  //   record.shared = true;
  //   record.dirty = true;
  //   await this.annotationService.saveRecord(record);
  // }

  async saveItem(record: AnnotationRecord) {
    // record.shared = true;
    record.dirty = true;
    this.editing = false;
    record.bodyValue = this.inputFormControl.value;
    await this.annotationService.saveRecord(record);
  }

  getPublishToolTip(item: AnnotationRecord): string {
    if (item.shared) {
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

  getSaveToolTip(item: AnnotationRecord): string {
    return 'save';
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
      // this.annotationService.handleItemFocusOff(this.comment);
    }
  }

  clicked() {
    // this.comment.editing = true;
    this.annotationService._focusOnComment(this.comment);
  }

  editItem(item: AnnotationRecord) {
    this.editing = true;
    this._inputRecord = item;
    this.inputFormControl.setValue(item.bodyValue);
    this.inputFormControl.markAsPristine();
    this.annotationService.sortComments();
  }

  deleteItem(item: AnnotationRecord) {
    if (this._inputRecord === item) {
      this.editing = false;
      this._inputRecord = null;
    }
    item.deleted = true;
    this.removeRecord(item);
    this.annotationService.saveRecord(item);
  }

  removeRecord(item: AnnotationRecord) {
    const ii = this.comment.records.indexOf(item);

    if (ii) {
      this.comment.records.splice(ii, 1);
      this.annotationService.sortComments();
    }
  }

  ngOnInit(): void {
    // console.log(this.comment);
    this.comment.component = this;

    this.inputFormControl.valueChanges.subscribe((val) => {
      // if (this._inputRecord && this._inputRecord.bodyValue !== val) {
      //   this._inputRecord.dirty = true;
      //   this._inputRecord.bodyValue = val;
      // }
    });

    if (this.comment.records[0].virgin) {
      this.setFocusMode(FocusModeEnum.CREATE);
      this._inputRecord = this.comment.records[0];
      this.initInput();
      this.annotationService.saveRecord(this._inputRecord);
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
