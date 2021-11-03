import { ElementRef } from '@angular/core';

export enum AnnotationMode {
  OFF = 'OFF',
  PEN = 'PEN',
  READY = 'READY',
  HIDE = 'HIDE',
  SHOW = 'SHOW',
  TEXT = 'TEXT',
  TOGGLE = 'TOOGLE',
}

export class AnnotationControlEvent {
  type: AnnotationMode;
  val?: any;
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

export type AnnotationUser = { userName: string; userId: string };

// This is what is drawn on the pdf.
export type AnnotationPath = { pos1: { x; y }; pos2: { x; y } }[];

export type BoundingBox = { x1: number; y1: number; x2: number; y2: number };
export type AnnotationMark = {
  page: number;
  boundingBox?: BoundingBox;
  type: AnnotationType;
  pos?: AnnotationPoint;
  path?: AnnotationPath;
};

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
  createdAt: string;
  modifiedAt?: string;
  saved: boolean;
  dirty: boolean;
  isPrivate?: boolean;
}
export interface AnnotationComment extends AnnotationRecord {
  mark?: AnnotationMark;
}

export interface AnnotationReply extends AnnotationRecord {
  parentId: string;
}

export type AnnotationMarkRender = (record: AnnotationComment) => void;

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
  getHeight: () => number;
  setFocusMode(focusMode: FocusModeEnum);
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
  record?: AnnotationComment;
  id?: string;
}

export interface AnnotationStorage {
  fetchDocument(
    documentId: string,
    userId: string
  ): Promise<AnnotationRecord[]>;
  saveAnnotation(record: AnnotationRecord);
}
