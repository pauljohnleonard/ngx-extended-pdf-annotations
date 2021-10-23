import { AnnotationService } from './annotation.service';
import {
  AnnotationMark,
  AnnotationMarkRender,
  AnnotationMode,
  AnnotationRecord,
  AnnotationType,
  PageEvent,
} from './classes';
import { setBoundingBoxOf } from './util';

export class PDFAnnotationManager {
  user = 'Paul';
  cnt = 0;
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

      const mark: AnnotationMark = {
        page: event.page,
        path: event.path,
        type,
      };

      record = {
        id: event.id,
        bodyValue: 'My Comment ' + this.cnt++,
        mark,
        motivation: 'comment',
        creator: {
          id: '',
          name: this.user,
        },
        createdAt: new Date().toISOString(),
      };
      setBoundingBoxOf(record, event);
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
