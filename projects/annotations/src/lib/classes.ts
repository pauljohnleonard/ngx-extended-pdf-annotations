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

export type AnnotationPoint = { x: number; y: number };
export type PageEvent = {
  id: string;
  type: PageEventType;
  mode?: AnnotationMode;
  page?: number;
  path?: AnnotationPath;
  pos?: AnnotationPoint;
};

// This is what is drawn on the pdf.

export type BoundingBox = { x1: number; y1: number; x2: number; y2: number };
export type AnnotationMark = {
  page: number;
  boundingBox?: BoundingBox;
  type: AnnotationType;
  pos?: AnnotationPoint;
  path?: AnnotationPath;
};

// This is the complete record we need to store.
export type AnnotationRecord = {
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
};
//

export type AnnotationMarkRender = (record: AnnotationRecord) => void;

export type PanelPosition = {};
