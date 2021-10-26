import { ConstantPool } from '@angular/compiler';
import { AfterViewInit, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
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

  users = ['Paul', 'Dag', 'Kaj'];

  userControl = new FormControl('');

  constructor(public annotationsService: AnnotationService) {}

  ngAfterViewInit(): void {
    this.annotationsService.subject$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.highlightPen = this.annotationsService.mode === AnnotationMode.PEN;
      });

    this.userControl.valueChanges.subscribe((name) => {
      const user = { name: name, id: this.hashCode(name) };
      console.log('SELECT:', user, this.hashCode(user));
      this.annotationsService.setUser(user);
    });
  }

  toogleAnnotations() {
    this.annotationsService.toggleAnnotations();
  }

  penAnnotate() {
    const on = this.annotationsService.mode === AnnotationMode.PEN;
    if (!on) {
      this.annotationsService.startPenAnnoation();
    } else {
      this.annotationsService.stopPenAnnoation();
    }
  }

  hashCode(str): string {
    var hash = 0,
      i,
      chr;
    if (str.length === 0) return '' + hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return '' + hash;
  }
}
