import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  AnnotationRecord,
  PanelPosition,
  PanelPositionHelper,
} from './classes';

@Injectable()
export class AnnotationService {
  annotationMap: { [id: string]: AnnotationRecord } = {};
  public newRecord$ = new Subject<AnnotationRecord>();
  panelPositionHelper: PanelPositionHelper;

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
    if (!this.panelPositionHelper) {
      throw new Error(
        'AnnotationService: you must provide a PanelPositionHelper'
      );
    }

    // TODO motive !== comment;
    const y = this.panelPositionHelper.getAnnotationPanelPos(anno);

    const pos: PanelPosition = { page: anno.mark.page, rank: 0, y };
    console.log('POS ', pos);
    return pos;
  }

  setPanelPositionHelper(pannelPosHelper: PanelPositionHelper) {
    this.panelPositionHelper = pannelPosHelper;
  }
}
