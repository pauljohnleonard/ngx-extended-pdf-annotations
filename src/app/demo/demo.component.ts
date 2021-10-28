import { ConstantPool } from '@angular/compiler';
import { AfterViewInit, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  AnnotationMode,
  AnnotationService,
} from 'projects/ngx-extended-pdf-annotations/src/public-api';
import { LocalStoreService } from '../local-store.service';

@UntilDestroy()
@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss'],
})
export class DemoComponent implements AfterViewInit {
  highlightPen = false;

  constructor(public annotationsService: AnnotationService) {
    this.annotationsService.setStorage(new LocalStoreService());
  }

  ngAfterViewInit(): void {
    this.annotationsService.modeSubject$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.highlightPen =
          this.annotationsService.getMode() === AnnotationMode.PEN;
      });
  }

  toogleAnnotations() {
    this.annotationsService.toggleAnnotations();
  }

  penAnnotate() {
    const on = this.annotationsService.getMode() === AnnotationMode.PEN;
    if (!on) {
      this.annotationsService.startPenAnnoation();
    } else {
      this.annotationsService.stopPenAnnoation();
    }
  }
}
