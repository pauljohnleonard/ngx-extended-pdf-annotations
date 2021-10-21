import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { UntilDestroy } from '@ngneat/until-destroy';
import { PageHandler } from './page-handler';

@UntilDestroy()
@Component({
  selector: 'lib-annotations',
  template: ` <p>annotations works!</p> `,
  styles: [],
})
export class AnnotationsComponent implements OnInit {
  // @ViewChild('annotionPanel') private annotionPanel: any;

  showAnnotationPanel = false;

  pages: { [page: number]: PageHandler } = {}; // PDFPageVIew
  showAnnotations: boolean;

  constructor(public elRef: ElementRef) {}

  async ngOnInit() {}

  penAnnotate() {}

  pageRendered(evt) {
    console.log('Page render ', evt.source);

    const page = evt.pageNumber;
    if (!this.pages[page]) {
      const pageHandler = new PageHandler(evt.source, page);
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
}
