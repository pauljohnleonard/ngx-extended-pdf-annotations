import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentItemComponent } from './comment-item/comment-item.component';
import { CommentComponent } from './comment-panel/annotations-panel-wrapper.component';
import { InlineSVGModule } from 'ng-inline-svg';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { AnnotationIconRegisterService } from './annotation-icon-register.service';
@NgModule({
  declarations: [CommentComponent, CommentItemComponent],
  imports: [
    CommonModule,
    InlineSVGModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  exports: [CommentComponent, CommentItemComponent],
})
export class NgxExtendPdfAnnotationsModule {
  constructor(public x: AnnotationIconRegisterService) {}
}
export { CommentItemComponent } from './comment-item/comment-item.component';
