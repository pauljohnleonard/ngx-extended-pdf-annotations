import { Component, OnInit, ViewChild } from '@angular/core';
import { AnnotationsComponent } from 'projects/annotations/src/public-api';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss'],
})
export class DemoComponent implements OnInit {
  @ViewChild(AnnotationsComponent) annotationsPanel;

  constructor() {}

  ngOnInit(): void {}

  penAnnotate() {}

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
