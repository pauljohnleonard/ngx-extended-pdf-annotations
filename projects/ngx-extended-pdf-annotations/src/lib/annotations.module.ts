import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentItemComponent } from './comment-item/comment-item.component';
import { CommentComponent } from './comment-panel/annotations-panel-wrapper.component';
import { InlineSVGModule } from 'ng-inline-svg';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClientModule } from '@angular/common/http';

import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
@NgModule({
  declarations: [CommentComponent, CommentItemComponent],
  imports: [
    CommonModule,
    InlineSVGModule,

    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    FormsModule,
    HttpClientModule,
    MatCheckboxModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule,
  ],
  exports: [CommentComponent, CommentItemComponent],
})
export class AnnotationsModule {}
