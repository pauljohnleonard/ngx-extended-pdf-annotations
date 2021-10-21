import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { fromEvent } from 'rxjs';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { debounceTime } from 'rxjs/operators';

const MOBILE_CHAT_WINDOW_OFFSET_FROM_TOP = 52;

export class UIChatMessage {
  isDeleted?: boolean;
  constructor(
    public id: string,
    public fromUserId: string,
    public message: string,
    public receivedAt: string,
    public replyToMessage?: UIChatMessage
  ) {}
}

const chatMesages: UIChatMessage[] = [
  {
    id: '1',
    fromUserId: '1',
    message: 'Hello Worlds',
    receivedAt: new Date().toISOString(),
  },

  {
    id: '2',
    fromUserId: '2',
    message: 'Goodbye cruel Worlds',
    receivedAt: new Date().toISOString(),
  },
];

@UntilDestroy()
@Component({
  selector: 'app-annotation',
  templateUrl: './annotation-window.component.html',
  styleUrls: ['./annotation-window.component.scss'],
})
export class AnnotationComponent implements OnInit {
  isMobileScreen = false;
  showNewMessagesBelowNotificationButton = false;

  chatWindowTitleText = '';
  messageInputFC = new FormControl({ value: '', disabled: true });
  replyingToMessage: UIChatMessage;
  messageIdForWhichDeleteMenuIsOpen = '';
  windowHeightForMobile: number;

  replyToMessage;

  chatService = {
    isInitialChatMessagesLoaded: true,
    chatMessages: chatMesages,
    chatWindowTitle: 'Title',
    channelHasEarlierMessages: true,
    hasLoadedEarlierMessages: true,
    isLoadingEarlierMessages: false,
    deleteMessage: (chatMessage) => {
      console.log(chatMessage);
    },
  };

  @ViewChild(MatInput) messageInput: MatInput;
  @ViewChild('bottomOfMessagesElement') bottomOfMessagesElement: ElementRef;
  @ViewChild('chatWindowScroll') chatWindowScrollElement: ElementRef;

  constructor(private breakpointObserver: BreakpointObserver) {}

  async ngOnInit() {}

  getIsChatWindowOpen() {
    // return this.chatService.isChatWindowOpen;
  }

  /**
   * Meant to detect mobile at component initialization, and detect changes between portrait and
   * landscape orientation, and detect when height changes because of mobile virtual keyboard or
   * other things.
   */
  private setupMobileBreakpointsAndResizeDetectionSubscriptions() {
    this.breakpointObserver
      .observe([Breakpoints.HandsetLandscape, Breakpoints.HandsetPortrait])
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        this.isMobileScreen = result.matches;
        if (this.isMobileScreen) {
          this.setWindowHeightForMobile();
        }
      });

    fromEvent(window, 'resize')
      .pipe(untilDestroyed(this), debounceTime(200))
      .subscribe(() => {
        this.setWindowHeightForMobile();
      });
  }

  private setWindowHeightForMobile() {
    this.windowHeightForMobile =
      window.innerHeight - MOBILE_CHAT_WINDOW_OFFSET_FROM_TOP;
  }

  private reset() {
    this.messageInputFC.reset('');
    this.replyingToMessage = undefined;
    this.showNewMessagesBelowNotificationButton = false;
    this.messageIdForWhichDeleteMenuIsOpen = '';
    this.chatWindowTitleText = this.chatService.chatWindowTitle;
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

  private getIsCurrentlyScrolledToBottom() {
    const chatScrollNativeElement = this.chatWindowScrollElement?.nativeElement;
    return chatScrollNativeElement
      ? chatScrollNativeElement.scrollTop +
          chatScrollNativeElement.clientHeight ===
          chatScrollNativeElement.scrollHeight
      : false;
  }

  initiateReplyToMessage(message: UIChatMessage) {
    this.replyingToMessage = message;
    // this.ifAlreadyScrolledToBottomDetectChangesAndScrollToBottomAgain();
    this.messageInput.focus();
  }

  cancelReplyingToMessage() {
    this.replyingToMessage = null;
  }

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
        this.sendChatMessage();
      }
    }
  }

  async sendChatMessage() {
    const message = this.messageInputFC.value.trim();

    if (message) {
      // this.messageInputFC.reset();
      // this.chatService.sendChatMessage(message, this.replyingToMessage);
      // this.replyingToMessage = null;
    }
  }

  // loadEarlierMessages() {
  //   this.chatService.loadEarlierMessages();
  // }

  hasChatMessages() {
    return this.chatService.chatMessages.length > 0;
  }
  isProcessingMessage(chatMessage) {
    return false;
  }

  isSentByCurrentUser(uiMessage: UIChatMessage) {
    return true;
  }

  isReplyToCurrentUser(uiMessage: UIChatMessage) {
    return true;
  }
  // isReplyToCurrentUser(uiMessage: UIChatMessage) {
  //   return uiMessage.replyToMessage?.fromUserId === this.boardmemberService.currentUser._id;
  // }

  getNameForUserId(userId) {
    return 'user' + userId;
  }

  onDeleteMenuOpenedForMessageId(messageId: string) {
    this.messageIdForWhichDeleteMenuIsOpen = messageId;
  }

  onDeleteMenuClosed() {
    // setTimeout is used to avoid an "expression changed after checked" error
    setTimeout(() => (this.messageIdForWhichDeleteMenuIsOpen = ''), 0);
  }

  trackByMessages(index: number, chatMessage: UIChatMessage) {
    return chatMessage.id;
  }
}
