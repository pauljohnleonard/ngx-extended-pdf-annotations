import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { PageHandler } from './page-handler';

export type AnnotationPath = { pos1: { x; y }; pos2: { x; y } }[];
export enum AnnotationMode {
  OFF = 'OFF',
  PEN = 'PEN',
}

export enum AnnotationEventType {
  START = 'START',
  END = 'END',
}

export interface AnnotationEvent {
  id: string;
  type: AnnotationEventType;
  pos?: { x: number; y: number };
  path?: AnnotationPath;
}

@UntilDestroy()
@Component({
  selector: 'ngx-extended-pdf-annotation-wrapper',
  template: `<ng-content></ng-content>`,
  styles: [],
})
export class AnnotationPanelWrapperComponent implements OnInit {
  showAnnotationPanel = false;
  pages: { [page: number]: PageHandler } = {}; // PDFPageVIew
  showAnnotations = true;
  subject$ = new Subject();
  annotationSubject$ = new Subject<AnnotationEvent>();
  mode = AnnotationMode.OFF;

  constructor(public elRef: ElementRef) {}

  async ngOnInit() {}

  get penIsOn() {
    return this.mode === AnnotationMode.PEN;
  }

  pageRendered(evt) {
    console.log('Page render ', evt.source);

    const page = evt.pageNumber;
    if (!this.pages[page]) {
      const pageHandler = new PageHandler(evt.source, page, this);
      this.pages[page] = pageHandler;
    } else {
      this.pages[page].update(evt.source);
    }
  }

  pdfLoaded(evt) {
    var container = document.getElementById('viewerContainer');
    container.style.display = 'flex';
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    container.appendChild(this.elRef.nativeElement);
    this.elRef.nativeElement.style.display = 'block';
    console.log(container);
    console.log('PDF LOADED 3', evt);
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
    for (const page of Object.keys(this.pages)) {
      this.pages[page].destroy();
    }
  }

  stopPenAnnoation() {
    console.log(' STOP annotation ');
    this.elRef.nativeElement.style.cursor = 'cursor';
    this.mode = AnnotationMode.OFF;
    this.subject$.next();
  }

  startPenAnnoation() {
    console.log(' START annotation ');
    this.elRef.nativeElement.style.cursor = 'pen';
    this.mode = AnnotationMode.PEN;
    this.subject$.next();
  }
}
