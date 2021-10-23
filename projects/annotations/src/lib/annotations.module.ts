import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AnnotationPanelWrapperComponent } from './annotations-panel-wrapper.component';
import { CommentPanelComponent } from './comment-panel/comment-panel.component';
import { CommentComponent } from './comment/comment.component';

@NgModule({
  declarations: [
    AnnotationPanelWrapperComponent,
    CommentPanelComponent,
    CommentComponent,
  ],
  imports: [CommonModule],
  exports: [AnnotationPanelWrapperComponent],
})
export class AnnotationsModule {}
