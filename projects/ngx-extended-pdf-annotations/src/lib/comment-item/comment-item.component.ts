import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { AnnotationService } from '../annotation.service';
import {
  FocusModeEnum,
  UIPanelItemIterface,
  UIPannelComment,
} from '../classes';

import { DateUtilService } from '../date-util.service';

@Component({
  selector: 'ngx-extended-pdf-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
})
export class CommentItemComponent implements OnInit, UIPanelItemIterface {
  @ViewChild(MatInput) messageInput: MatInput;
  @Input() comment: UIPannelComment;

  isMobileScreen = false;
  FocusMode = FocusModeEnum;
  messageInputFC = new FormControl({ value: '', disabled: false });

  windowHeightForMobile: number;

  replyToMessage;
  private focusmode = FocusModeEnum.CREATE;
  editComment = true;
  highlight = true;
  expand = true;

  constructor(
    public date: DateUtilService,
    public el: ElementRef,
    public annotationService: AnnotationService
  ) {}

  // Set the mode of the item.
  // Do not call directly. Let annotation manager do it.
  setFocusMode(focusMode: FocusModeEnum) {
    this.focusmode = focusMode;

    console.log('FOCUS MODE', focusMode, this.comment);
    switch (focusMode) {
      case FocusModeEnum.CREATE:
      case FocusModeEnum.FOCUS:
      case FocusModeEnum.HIGHLIGHT_ON:
        this.editComment = true;
        this.highlight = true;
        this.expand = true;
        break;
      default:
        this.editComment = false;
        this.highlight = false;
        this.expand = false;
    }
  }

  clicked() {
    // this.comment.editing = true;
    this.annotationService._focusOnComment(this.comment);
  }

  ngOnInit(): void {
    console.log(this.comment);
    this.comment.component = this;

    this.messageInputFC.valueChanges.subscribe((val) => {
      this.comment.record.bodyValue = val;
    });
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

  // initiateReplyToMessage(message: UIPannelComment) {
  //   this.replyingToMessage = message;
  //   // this.ifAlreadyScrolledToBottomDetectChangesAndScrollToBottomAgain();
  //   this.messageInput.focus();
  // }

  // cancelReplyingToMessage() {
  //   this.replyingToMessage = null;
  // }

  onKeydownInput(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const isShiftDown = event.shiftKey;
      const doAddNewlineInsteadOfSendingMessage =
        isShiftDown || this.isMobileScreen;

      // [mention] directive has opened and closed events, but the closed event is unreliable.
      // It doesn't trigger when the mention list is closed by "typing out" of the mentions, as in
      // typing something that is not a mention label after opening it.
      // Therefore this more low-level approach to find out if the mentions list is open or not.
      const mentionDropdownElement = document.querySelector(
        'ul.mention-dropdown'
      );
      const isMentionDropdownOpen =
        mentionDropdownElement &&
        !mentionDropdownElement.hasAttribute('hidden');
      if (isMentionDropdownOpen) {
        event.preventDefault();
        return;
      }

      if (!doAddNewlineInsteadOfSendingMessage) {
        event.preventDefault(); // Prevent adding a newline
        this.comnmitComment();
      }
    }
  }

  clearMessage() {
    this.messageInputFC.setValue('');
  }

  async comnmitComment() {
    console.log('Commmit comment');
    this.annotationService._commitComment(this.comment);
  }

  // loadEarlierMessages() {
  //   this.chatService.loadEarlierMessages();
  // }

  isProcessingMessage(chatMessage) {
    return false;
  }

  isSentByCurrentUser(uiMessage: UIPannelComment) {
    return true;
  }

  isReplyToCurrentUser(uiMessage: UIPannelComment) {
    return true;
  }

  // isReplyToCurrentUser(uiMessage: UIChatMessage) {
  //   return uiMessage.replyToMessage?.fromUserId === this.boardmemberService.currentUser._id;
  // }

  // onDeleteMenuOpenedForMessageId(messageId: string) {
  //   this.messageIdForWhichDeleteMenuIsOpen = messageId;
  // }

  // onDeleteMenuClosed() {
  //   // setTimeout is used to avoid an "expression changed after checked" error
  //   setTimeout(() => (this.messageIdForWhichDeleteMenuIsOpen = ''), 0);
  // }
}
