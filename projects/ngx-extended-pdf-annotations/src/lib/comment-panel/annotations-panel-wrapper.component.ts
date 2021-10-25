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

  constructor(
    public elRef: ElementRef,
    public annotationService: AnnotationService
  ) {
    const pannelPosHelper: PanelPositionHelper = {
      getAnnotationPanelPos: (record: AnnotationRecord) => {
        const page = this.annotationService.pages[record.mark.page];
        return page.getAnnotationPanelPos(record);
      },
    };

    annotationService.setPanelPositionHelper(pannelPosHelper);

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
            var container = document.getElementById('viewerContainer');
            container.style.display = 'flex';
            container.appendChild(this.elRef.nativeElement);
            this.elRef.nativeElement.style.display = 'block';
            break;
        }
      });
  }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  async ngOnInit() {
    // const viewerContainer = document.querySelector(
    //   '#viewerContainer'
    // ) as HTMLElement;
    // this.initAnnotationListener();
  }

  toggleAnnotations() {
    this.showAnnotations = !this.showAnnotations;
    if (this.showAnnotations) {
      this.elRef.nativeElement.style.display = 'block';
    } else {
      this.elRef.nativeElement.style.display = 'none';
    }
  }

  onNgDestroy() {
    for (const page of Object.keys(this.annotationService.pages)) {
      this.annotationService.pages[page].destroy();
    }
    this.annotationService.destroy();
  }
}
