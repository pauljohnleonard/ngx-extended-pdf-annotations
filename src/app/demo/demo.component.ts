import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  AnnotationMode,
  AnnotationPanelWrapperComponent,
} from 'projects/annotations/src/public-api';

@UntilDestroy()
@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss'],
})
export class DemoComponent implements AfterViewInit {
  @ViewChild(AnnotationPanelWrapperComponent)
  annotationsPanel: AnnotationPanelWrapperComponent;
  highlightPen = false;
  constructor() {}

  ngAfterViewInit(): void {
    this.annotationsPanel.subject$.pipe(untilDestroyed(this)).subscribe(() => {
      this.highlightPen = this.annotationsPanel.mode === AnnotationMode.PEN;
    });
  }

  penAnnotate() {
    const on = this.annotationsPanel.penIsOn;
    if (!on) {
      this.annotationsPanel.startPenAnnoation();
    } else {
      this.annotationsPanel.stopPenAnnoation();
    }
  }

  // pageRendered(evt) {
  //   console.log('Page render ', evt.source);

  //   const page = evt.pageNumber;
  //   if (!this.pages[page]) {
  //     const pageHandler = new PageHandler(evt.source, page);
  //     this.pages[page] = pageHandler;
  //   } else {
  //     this.pages[page].update(evt.source);
  //   }
  // }

  // pdfLoaded(evt) {
  //   var container = document.getElementById('viewerContainer');
  //   container.style.display = 'flex';
  //   // await new Promise((resolve) => setTimeout(resolve, 3000));
  //   container.appendChild(this.annotionPanel.nativeElement);
  //   this.annotionPanel.nativeElement.style.display = 'block';
  //   console.log(container);
  //   console.log('PDF LOADED 3', evt);
  // }

  // toggleAnnotations() {
  //   this.documentService.showAnnotations =
  //     !this.documentService.showAnnotations;
  //   if (this.documentService.showAnnotations) {
  //     this.annotionPanel.nativeElement.style.display = 'block';
  //   } else {
  //     this.annotionPanel.nativeElement.style.display = 'none';
  //   }
  // }
}
