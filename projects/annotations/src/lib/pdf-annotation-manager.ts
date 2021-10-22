import { Subject } from 'rxjs';
import { AnnotationService } from './annotation.service';
import {
  AnnotationMark,
  AnnotationMarkRender,
  AnnotationMode,
  AnnotationRecord,
  AnnotationType,
  BoundingBox,
  PageEvent,
} from './classes';
import { boundingBoxOf } from './util';

export class PDFAnnotationManager {
  user = 'Paul';

  // emit when a new annotation is created
  //   newRecordSubject$ = new Subject<AnnotationRecord>();

  constructor(
    private renderer: AnnotationMarkRender,
    private annotations: AnnotationService
  ) {}

  // delete annotations
  // if no argument delete all.
  deleteAnnotations(arg?: { annotationIds: string[] }) {}

  // update the given annotation
  updateAnnotation(data: AnnotationRecord) {}

  // add new annoations.
  addAnnotations(arg: AnnotationRecord[]) {}

  //   registerEventListener(
  //     func: (event: any) => Promise<void>,
  //     eventOptions: {}
  //   ) {}

  // INternal interface
  _handlePageEvent(event: PageEvent) {
    const id = event.id;
    let record: AnnotationRecord = this.annotations.annotationMap[id];
    if (!record) {
      let type: AnnotationType;

      switch (event.mode) {
        case AnnotationMode.PEN:
          type = AnnotationType.PATH;
      }

      const boundingBox: BoundingBox = boundingBoxOf(event);

      const mark: AnnotationMark = {
        page: event.page,
        path: event.path,
        type,
      };

      record = {
        id: event.id,
        bodyValue: 'My Comment',
        mark,
        motivation: 'comment',
        creator: {
          id: '',
          name: this.user,
        },
        createdAt: new Date().toISOString(),
      };
      this.annotations._addNewRecord(record);
    }
    this.renderer(record);
  }

  _redraw(page?: number) {
    for (const id of Object.keys(this.annotations.annotationMap)) {
      const record = this.annotations.annotationMap[id];
      if (!page || (record.mark && record.mark.page === page)) {
        this.renderer(record);
      }
    }
  }
}
