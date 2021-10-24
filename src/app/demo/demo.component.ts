import { AfterViewInit, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  AnnotationMode,
  AnnotationService,
} from 'projects/ngx-extended-pdf-annotations/src/public-api';

@UntilDestroy()
@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss'],
})
export class DemoComponent implements AfterViewInit {
  highlightPen = false;
  constructor(public annotationsService: AnnotationService) {}

  ngAfterViewInit(): void {
    this.annotationsService.subject$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.highlightPen = this.annotationsService.mode === AnnotationMode.PEN;
      });
  }

  toogleAnnotations() {}

  penAnnotate() {
    const on = this.annotationsService.penIsOn;
    if (!on) {
      this.annotationsService.startPenAnnoation();
    } else {
      this.annotationsService.stopPenAnnoation();
    }
  }
}
