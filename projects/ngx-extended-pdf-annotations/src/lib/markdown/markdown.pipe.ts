import { Pipe, PipeTransform } from '@angular/core';
import { MarkedOptions, setOptions, parse } from 'marked';
import { myRenderer } from './markdown-helper';
// Ugly hack to get link functionality out of marked library and modify slightly.

@Pipe({
  name: 'MarkdownToHtml',
})
export class MarkdownToHtmlPipe implements PipeTransform {
  public transform(markdown: string, options?: MarkedOptions): string {
    if (markdown == null) {
      return '';
    }
    setOptions({ renderer: myRenderer });
    return parse(markdown, { breaks: true });
  }
}

export const isAlreadyHTML = (value) => {
  value = value || '';
  const trimmed = value.trim();
  return trimmed.startsWith('<') && trimmed.endsWith('>');
};
