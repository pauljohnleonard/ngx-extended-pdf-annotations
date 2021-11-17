import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AnnotationImageService {
  noteImg: any;
  constructor() {}

  // Image for a note
  async getNoteImage() {
    if (this.noteImg) {
      return this.noteImg;
    }

    return new Promise((resolve) => {
      const noteImg = new Image();
      noteImg.src = '/assets/ngx-extended-pdf-annotations/comment_yellow.svg';
      noteImg.onload = () => {
        this.noteImg = noteImg;
        resolve(noteImg);
      };
    });
  }

  // Custom cursors
  getPenCursorUrl() {
    return "url('/assets/ngx-extended-pdf-annotations/pencil.png')  0 32 ,auto";
  }

  getNoteCursorUrl() {
    return "url('/assets/ngx-extended-pdf-annotations/note.png')  0 0 ,auto";
  }
}
