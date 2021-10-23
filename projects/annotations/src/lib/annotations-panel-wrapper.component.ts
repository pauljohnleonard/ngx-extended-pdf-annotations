import { ContentObserver } from '@angular/cdk/observers';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import {
  PageEventType,
  AnnotationMode,
  AnnotationRecord,
  PanelPositionHelper,
  AnnotationPath,
} from './classes';
import { PageHandler } from './page-handler';
import { AnnotationService } from './annotation.service';
import { PDFAnnotationManager } from './pdf-annotation-manager';
import { CommentPanelComponent } from './comment-panel/comment-panel.component';
import { AnnotationLayoutService } from './annotation-layout.service';

export interface AnnotationEvent {
  id: string;
  type: PageEventType;
  pos?: { x: number; y: number };
  path?: AnnotationPath;
}

@UntilDestroy()
@Component({
  selector: 'ngx-extended-pdf-annotation-wrapper',
  template: ` <lib-comment-panel [commentItem]="commentItem">
  </lib-comment-panel>`,
  styles: [],
  providers: [AnnotationService, AnnotationLayoutService],
})
export class AnnotationPanelWrapperComponent implements OnInit {
  @ViewChild(CommentPanelComponent) commentPanel: CommentPanelComponent;
  @Input('commentItem') commentItem;

  showAnnotationPanel = false;

  showAnnotations = true;
  subject$ = new Subject<AnnotationMode>();
  mode = AnnotationMode.OFF;
  annotationManager: PDFAnnotationManager;

  constructor(
    public elRef: ElementRef,
    public annotationService: AnnotationService,
    public layout: AnnotationLayoutService
  ) {
    const pannelPosHelper: PanelPositionHelper = {
      getAnnotationPanelPos: (record: AnnotationRecord) => {
        const page = this.layout.pages[record.mark.page];
        return page.getAnnotationPanelPos(record);
      },
    };

    annotationService.setPanelPositionHelper(pannelPosHelper);

    const renderer = (record: AnnotationRecord) => {
      if (!record.mark) return;
      const page = this.layout.pages[record.mark.page];
      page.draw(record.mark);
      // console.log(' RENDER ', page);
    };

    this.annotationManager = new PDFAnnotationManager(
      renderer,
      annotationService
    );

    // this.annotationManager.newRecordSubject$
    //   .pipe(untilDestroyed(this))
    //   .subscribe((record) => {
    //     this.annotationService._addNewRecord(record);
    //   });
  }

  async ngOnInit() {
    const viewerContainer = document.querySelector(
      '#viewerContainer'
    ) as HTMLElement;

    viewerContainer.addEventListener('scroll', (evt) => {
      this.layout.srollEvent(evt);
    });
  }

  get penIsOn() {
    return this.mode === AnnotationMode.PEN;
  }

  pageRendered(evt) {
    //     console.log('Page render ', evt.source);

    const page = evt.pageNumber;
    if (!this.layout.pages[page]) {
      const pageHandler = new PageHandler(evt.source, page, this);
      this.layout.pages[page] = pageHandler;
    } else {
      this.layout.pages[page].update(evt.source);
      this.annotationManager._redraw(page);
    }
  }

  pdfLoaded(evt) {
    var container = document.getElementById('viewerContainer');
    container.style.display = 'flex';
    container.appendChild(this.elRef.nativeElement);
    this.elRef.nativeElement.style.display = 'block';
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
    for (const page of Object.keys(this.layout.pages)) {
      this.layout.pages[page].destroy();
    }
  }

  stopPenAnnoation() {
    console.log(' STOP annotation ');
    this.elRef.nativeElement.style.cursor = 'cursor';
    this.mode = AnnotationMode.OFF;
    this.subject$.next(this.mode);
  }

  startPenAnnoation() {
    console.log(' START annotation ');
    this.elRef.nativeElement.style.cursor = 'pen';
    this.mode = AnnotationMode.PEN;
    this.subject$.next(this.mode);
  }
}
