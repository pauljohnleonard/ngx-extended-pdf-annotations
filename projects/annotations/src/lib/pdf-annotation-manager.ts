import {
  AnnotationMark,
  AnnotationMarkRender,
  AnnotationMode,
  AnnotationRecord,
  AnnotationType,
  PageEvent,
} from './classes';

export class PDFAnnotationManager {
  annotationMap: { [id: string]: AnnotationRecord } = {};
  user = 'Paul';

  constructor(private renderer: AnnotationMarkRender) {}

  // delete annotations
  // if no argument delete all.
  deleteAnnotations(arg?: { annotationIds: string[] }) {}

  // update the given annotation
  updateAnnotation(data: AnnotationRecord) {}

  // add new annoations.
  addAnnotations(arg: AnnotationRecord[]) {}

  registerEventListener(
    func: (event: any) => Promise<void>,
    eventOptions: {}
  ) {}

  // INternal interface
  _handlePageEvent(event: PageEvent) {
    const id = event.id;
    let record: AnnotationRecord = this.annotationMap[id];
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
        bodyValue: 'My Comment',
        mark,
        motivation: 'comment',
        creator: {
          id: '',
          name: this.user,
        },
        createdAt: new Date().toISOString(),
      };
      this.annotationMap[event.id] = record;
    }

    this.renderer(record);
  }

  _redraw(page?: number) {
    for (const id of Object.keys(this.annotationMap)) {
      const record = this.annotationMap[id];
      if (!page || (record.mark && record.mark.page === page)) {
        this.renderer(record);
      }
    }
  }
}
