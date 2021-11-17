import { Subject } from 'rxjs';
import { AnnotationService } from './annotation.service';
import { AnnotationType } from './classes';
import { SELECTION_ACTIVATE_TIME } from './constants';

//  https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript

export class AnnotationTextSelection {
  private selectionEnd$ = new Subject<boolean>();
  isTouch: boolean;

  constructor(public annotationService: AnnotationService) {
    this.isTouch =
      'ontouchstart' in window || (navigator as any).msMaxTouchPoints > 0;

    if (this.isTouch) {
      let stamp;
      document.addEventListener(
        'selectionchange',
        (event) => {
          let now = Date.now();
          if (stamp && now - stamp > SELECTION_ACTIVATE_TIME) {
            this.annotationService.factory.createTextAnnotation();
            stamp = undefined;
          } else {
            stamp = now;
          }
        },
        false
      );
    } else {
      window.addEventListener('pointerup', () => {
        if (this.annotationService.focusHelper.mode === AnnotationType.TEXT) {
          this.annotationService.factory.createTextAnnotation();
        }
      });
    }
  }
}
