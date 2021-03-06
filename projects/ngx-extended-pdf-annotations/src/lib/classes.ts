import { ElementRef } from '@angular/core';
import { Subject } from 'rxjs';

export enum AnnotationType {
  OFF = 'OFF',
  PEN = 'PEN',
  READY = 'READY',
  HIDE = 'HIDE',
  SHOW = 'SHOW',
  TEXT = 'TEXT',
  TOGGLE = 'TOOGLE',
  NOTE = 'NOTE',
}

export class AnnotationControlEvent {
  type: AnnotationType;
  val?: any;
}

export enum PageEventType {
  START = 'START',
  PEN_UP = 'PEN_UP',
  UPDATE = 'UPDATE',
}

// export enum AnnotationType {
//   PEN = 'PEN',
//   TEXT = 'TEXT',
//   NOTE = "NOTE"
// }

export type AnnotationPoint = { x: number; y: number };

export type AnnotationPageRect = {
  page: number;
  pos1: AnnotationPoint;
  pos2: AnnotationPoint;
};

export type AnnotationEdge = {
  pos1: AnnotationPoint;
  pos2: AnnotationPoint;
};
export type AnnotationTextSelection = AnnotationPageRect[];

export type AnnotationPageEventType =
  | 'MOUSE_UP'
  | 'MOUSE_MOVE'
  | 'MOUSE_DOWN'
  | 'DESTROY'
  | 'OFF';
export type PageEvent = {
  id: string;
  type: PageEventType;
  event: AnnotationPageEventType;
  mode?: AnnotationType;
  page?: number;
  path?: AnnotationPath;
  pos?: AnnotationPoint;
};

export type AnnotationUser = {
  userName: string;
  userId: string;
  isAdmin?: boolean;
};

// This is what is drawn on the pdf.
export type AnnotationPath = { pos1: { x; y }; pos2: { x; y } }[];

export type BoundingBox = { x1: number; y1: number; x2: number; y2: number };

export type AnnotationPagePoly = {
  page: number;
  boundingPoly: AnnotationPoint[];
};

export interface AnnotationMark {
  type: AnnotationType;
  page: number; // first page if bounds mulitple pages.
  pages?: number[];
  pos?: AnnotationPoint; // calculated pater
  boundingBox?: BoundingBox; // calculated later

  // PEN
  path?: AnnotationPath;

  // TEXT MARK
  pageRects?: AnnotationPageRect[];
  edges?: AnnotationEdge[];
}

// This is the complete record we need to store.

export enum AnnotationItemType {
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
}
export interface AnnotationRecord extends AnnotationUser {
  documentId: string;
  id: string;
  type: AnnotationItemType;
  bodyValue: string;
  virgin: boolean;
  dirty: boolean;
  shared?: boolean;
  createdAt: string;
  modifiedAt?: string;
  deleted?: boolean;
  mark?: AnnotationMark;
  parentId?: string;
  noHighlight?: boolean;
}

export type AnnotationMarkRender = (record: AnnotationRecord) => void;

export type PanelPosition = {
  page: number;
  rank: number;
  y: number;
  yPlot: number;
};

export enum FocusModeEnum {
  CREATE = 'CREATE',
  FOCUS = 'FOCUS',
  CLOSED = 'CLOSED',
  HIGHLIGHT_OFF = 'HIGHLIGHT_OFF',
  HIGHLIGHT_ON = 'HIGHLIGHT_ON',
}
export interface UIPanelItemIterface {
  updateExternalReply(record: AnnotationRecord);
  getHeight: () => number;
  setFocusMode(focusMode: FocusModeEnum);
  hasFocus: boolean;
}

export class UIPannelComment {
  pos?: PanelPosition;
  records: AnnotationRecord[];
  // editing: boolean;
  component?: UIPanelItemIterface;
}

export enum AnnotationMessageEnum {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
export class AnnotationMessage {
  type: AnnotationMessageEnum;
  record?: AnnotationRecord;
  id?: string;
}

export interface AnnotationStorage {
  // Use this for real time updates.
  update$: Subject<AnnotationPayload>;

  // Get the document annotations from storage
  fetchDocument(
    documentId: string,
    userId: string
  ): Promise<AnnotationRecord[]>;

  // Add or update an annotation.
  updateAnnotation(record: AnnotationRecord);
}

export type AnnotationPayload = {
  record?: AnnotationRecord;
  annotationIds?: string[];
  documentId?: string;
  clientHash: string;
  type: 'DELETE' | 'UPDATE';
};
