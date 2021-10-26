import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  PageEventType,
  AnnotationMode,
  AnnotationRecord,
  PanelPositionHelper,
  AnnotationPath,
} from '../classes';

import { AnnotationService } from '../annotation.service';

export interface AnnotationEvent {
  id: string;
  type: PageEventType;
  pos?: { x: number; y: number };
  path?: AnnotationPath;
}

@UntilDestroy()
@Component({
  selector: 'ngx-extended-pdf-annotation',
  templateUrl: './comment-panel.component.html',
  styleUrls: ['./comment-panel.component.scss'],
})
export class CommentComponent implements OnInit, OnDestroy {
  @Input('commentItem') commentItem;

  showAnnotationPanel = false;

  showAnnotations = true;
  viewContainer: HTMLElement;

  constructor(
    public elRef: ElementRef,
    public annotationService: AnnotationService
  ) {}
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  // setVisible(yes) {
  //   if (yes === this.isVisible) {
  //     return;
  //   }
  //   if (yes) {
  //     console.log(' VISIBLE ');
  //     this.viewContainer.style.display = 'flex';
  //     this.elRef.nativeElement.style.display = 'block';
  //   } else {
  //     console.log(' HIDE ');
  //     this.elRef.nativeElement.style.display = 'none';
  //   }
  //   this.isVisible = yes;
  // }

  async ngOnInit() {
    const pannelPosHelper: PanelPositionHelper = {
      getAnnotationPanelPos: (record: AnnotationRecord) => {
        const page = this.annotationService.pages[record.mark.page];
        return page.getAnnotationPanelPos(record);
      },
    };

    this.annotationService.setPanelPositionHelper(pannelPosHelper);
    this.viewContainer = document.getElementById('viewerContainer');
    this.viewContainer.appendChild(this.elRef.nativeElement);

    this._showCommentPanel(true);
    this.annotationService.subject$
      .pipe(untilDestroyed(this))
      .subscribe((mode) => {
        switch (mode) {
          case AnnotationMode.OFF:
            console.log(' STOP annotation ');
            this.elRef.nativeElement.style.cursor = 'cursor';
            break;

          case AnnotationMode.PEN:
            console.log(' START annotation ');
            this.elRef.nativeElement.style.cursor = 'pen';
            break;

          case AnnotationMode.READY:
            this.viewContainer = document.getElementById('viewerContainer');
            break;

          case AnnotationMode.SHOW:
          case AnnotationMode.HIDE:
            this._showCommentPanel(mode === AnnotationMode.SHOW);
            break;
        }
      });
  }

  _showCommentPanel(yes) {
    if (yes) {
      console.log(' TOggle anno  ON ');
      this.elRef.nativeElement.style.display = 'block';
      this.viewContainer.style.display = 'flex';
    } else {
      console.log(' TOggle anno  OFF ');
      this.elRef.nativeElement.style.display = 'none';
      this.viewContainer.style.display = 'block';
    }
  }

  onNgDestroy() {
    for (const page of Object.keys(this.annotationService.pages)) {
      this.annotationService.pages[page].destroy();
    }
    this.annotationService.destroy();
  }
}
