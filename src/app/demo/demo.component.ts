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

  toogleAnnotations() {}

  penAnnotate() {
    const on = this.annotationsPanel.penIsOn;
    if (!on) {
      this.annotationsPanel.startPenAnnoation();
    } else {
      this.annotationsPanel.stopPenAnnoation();
    }
  }
}
