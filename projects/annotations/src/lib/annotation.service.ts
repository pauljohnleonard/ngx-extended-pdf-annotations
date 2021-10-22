import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AnnotationRecord, PanelPosition } from './classes';

@Injectable()
export class AnnotationService {
  annotationMap: { [id: string]: AnnotationRecord } = {};
  public newRecord$ = new Subject<AnnotationRecord>();

  constructor() {
    console.log(' PanelHelper INIT');
  }

  _addNewRecord(record: AnnotationRecord): boolean {
    if (this.annotationMap[record.id]) return false;
    this.annotationMap[record.id] = record;
    this.newRecord$.next(record);
    return true;
  }

  getAnnotationPanelPos(anno: AnnotationRecord): PanelPosition {
    return { page: anno.mark.page, rank: 0, y: 50 };
  }
}
