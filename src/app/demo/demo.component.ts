import { AfterViewInit, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  AnnotationType,
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

  textLayer = false;
  AnnotationType = AnnotationType;
  constructor(
    public annotationsService: AnnotationService,
    public storage: LocalStoreService
  ) {}

  async ngAfterViewInit() {
    const documentId = '1234';

    // this.annotationsService.setMode(AnnotationType.HIDE);

    await this.storage.initialize();

    await this.annotationsService.initialize({
      storage: this.storage,
      user: this.user,
      documentId,
    });
  }

  toogleAnnotations() {
    this.annotationsService.handleControlEvent({
      type: AnnotationType.TOGGLE,
    });
  }

  penAnnotate() {
    const val = this.annotationsService.getMode() !== AnnotationType.PEN;
    this.annotationsService.handleControlEvent({
      type: AnnotationType.PEN,
      val,
    });
  }

  textAnnotate() {
    const val = this.annotationsService.getMode() !== AnnotationType.TEXT;
    this.textLayer = val;
    console.log('TEXT LAYER ', this.textLayer);
    this.annotationsService.handleControlEvent({
      type: AnnotationType.TEXT,
      val,
    });
  }

  noteAnnotate() {
    const val = this.annotationsService.getMode() !== AnnotationType.NOTE;

    this.annotationsService.handleControlEvent({
      type: AnnotationType.NOTE,
      val,
    });
  }
}
