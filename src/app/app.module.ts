import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { DemoComponent } from './demo/demo.component';
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
import { AnnotationsModule } from 'projects/annotations/src/lib/annotations.module';

@NgModule({
  declarations: [AppComponent, DemoComponent],
  imports: [
    BrowserModule,
    InlineSVGModule,
    NgxExtendedPdfViewerModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatIconModule,
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
    AnnotationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
