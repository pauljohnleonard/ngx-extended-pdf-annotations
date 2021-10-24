import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentComponent } from './comment-panel/annotations-panel-wrapper.component';

@NgModule({
  declarations: [CommentComponent],
  imports: [CommonModule],
  exports: [CommentComponent],
})
export class AnnotationsModule {}
