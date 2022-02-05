import { NgModule } from '@angular/core';
import { MarkdownToHtmlPipe } from './markdown.pipe';

@NgModule({
  declarations: [MarkdownToHtmlPipe],
  exports: [MarkdownToHtmlPipe],
})
export class MarkdownModule {}

export * from './markdown-helper';
export * from './markdown.pipe';
