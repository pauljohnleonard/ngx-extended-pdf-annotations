import { Injectable } from '@angular/core';
import { PageHandler } from './page-handler';

@Injectable()
export class AnnotationLayoutService {
  pages: { [page: number]: PageHandler } = {}; // PDFPageVIew

  srollEvent(evt: Event) {
    // this.pages[0].scrollEvent(evt);
  }

  constructor() {}
}
