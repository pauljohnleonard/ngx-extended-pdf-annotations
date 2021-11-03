import { ConstantPool } from '@angular/compiler';
import { AfterViewInit, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  AnnotationControlEventType,
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

  highlightPen = false;
  textLayer = false;

  constructor(
    public annotationsService: AnnotationService,
    public storage: LocalStoreService
  ) {}

  async ngAfterViewInit() {
    const documentId = '1234';

    await this.storage.initialize();

    await this.annotationsService.initialize({
      storage: this.storage,
      user: this.user,
      documentId,
    });

    this.annotationsService.modeSubject$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.highlightPen =
          this.annotationsService.getMode() === AnnotationMode.PEN;
      });
  }

  toogleAnnotations() {
    this.annotationsService.handleControlEvent({
      type: AnnotationControlEventType.TOGGLE,
    });
  }

  penAnnotate() {
    const val = this.annotationsService.getMode() !== AnnotationMode.PEN;
    this.annotationsService.handleControlEvent({
      type: AnnotationControlEventType.PEN,
      val,
    });
  }

  textAnnotate() {
    const val = this.annotationsService.getMode() !== AnnotationMode.TEXT;

    this.textLayer = val;
    this.annotationsService.handleControlEvent({
      type: AnnotationControlEventType.TEXT,
      val,
    });
  }
}
