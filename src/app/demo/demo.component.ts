import { AfterViewInit, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  AnnotationMode,
  AnnotationService,
  AnnotationUser,
} from 'projects/ngx-extended-pdf-annotations/src/public-api';
import { LocalStoreService } from '../local-store.service';

@UntilDestroy()
@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss'],
})
export class DemoComponent implements AfterViewInit {
  @Input() user: AnnotationUser;

  textLayer = true;
  AnnotationMode = AnnotationMode;
  constructor(
    public annotationsService: AnnotationService,
    public storage: LocalStoreService
  ) {
    // addEventListener version
    document.addEventListener('selectionchange', () => {
      console.log('-----------------------------------');
      const selection = document.getSelection();
      const rangeCount = selection.rangeCount;
      for (let i = 0; i < rangeCount; i++) {
        const range = selection.getRangeAt(i);
        const rects: DOMRectList = range.getClientRects();
        for (let i = 0; i < rects.length; i++) {
          let rect = rects[i];
          console.log(rect);
        }
      }
    });
  }

  async ngAfterViewInit() {
    const documentId = '1234';

    await this.storage.initialize();

    await this.annotationsService.initialize({
      storage: this.storage,
      user: this.user,
      documentId,
    });
  }

  toogleAnnotations() {
    this.annotationsService.handleControlEvent({
      type: AnnotationMode.TOGGLE,
    });
  }

  penAnnotate() {
    const val = this.annotationsService.getMode() !== AnnotationMode.PEN;
    this.annotationsService.handleControlEvent({
      type: AnnotationMode.PEN,
      val,
    });
  }

  textAnnotate() {
    const val = this.annotationsService.getMode() !== AnnotationMode.TEXT;
    this.textLayer = val;
    console.log('TEXT LAYER ', this.textLayer);
    this.annotationsService.handleControlEvent({
      type: AnnotationMode.TEXT,
      val,
    });
  }
}
