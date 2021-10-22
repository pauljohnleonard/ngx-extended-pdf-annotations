import { AnnotationPath } from './annotations-panel-wrapper.component';

export enum AnnotationMode {
  OFF = 'OFF',
  PEN = 'PEN',
}

export enum PageEventType {
  START = 'START',
  PEN_UP = 'PEN_UP',
  UPDATE = 'UPDATE',
}

export enum AnnotationType {
  PATH = 'PATH',
}

export interface PageEvent {
  id: string;
  type: PageEventType;
  mode?: AnnotationMode;
  page?: number;
  path?: AnnotationPath;
  pos?: { x: number; y: number };
}

// This is what is drawn on the pdf.
export class AnnotationMark {
  page: number;
  boundingBox?: { x1: number; y1: number; x2: number; y2: number };
  type: AnnotationType;
  path?: AnnotationPath;
}

// This is the complete record we need to store.
export class AnnotationRecord {
  //   type: string;
  id: string;
  bodyValue: string;
  motivation: 'comment' | 'reply';
  parentId?: string;
  mark?: AnnotationMark;
  creator: {
    id: string;
    name: string;
  };
  createdAt: string;
  modifiedAt?: string;
}
//

export type AnnotationMarkRender = (record: AnnotationRecord) => void;
