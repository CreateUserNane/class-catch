import { DomSanitizer } from '@angular/platform-browser';
import { Pipe, PipeTransform, SecurityContext } from '@angular/core';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const blocks: string[] = [];
    const lines = value.replace(/\r\n?/g, '\n').split('\n');
    let paragraph: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushParagraph = (): void => {
      if (paragraph.length > 0) {
        blocks.push(`<p>${this.formatInline(paragraph.join(' '))}</p>`);
        paragraph = [];
      }
    };

    const closeList = (): void => {
      if (listType) {
        blocks.push(`</${listType}>`);
        listType = null;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        closeList();
        continue;
      }

      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      if (heading) {
        flushParagraph();
        closeList();
        const level = heading[1].length + 1;
        blocks.push(`<h${level}>${this.formatInline(heading[2])}</h${level}>`);
        continue;
      }

      if (/^---+$/.test(line)) {
        flushParagraph();
        closeList();
        blocks.push('<hr>');
        continue;
      }

      const listItem = /^(?:([-*])|(\d+)\.)\s+(.+)$/.exec(line);
      if (listItem) {
        flushParagraph();
        const nextListType = listItem[2] ? 'ol' : 'ul';
        if (listType !== nextListType) {
          closeList();
          listType = nextListType;
          blocks.push(`<${listType}>`);
        }
        blocks.push(`<li>${this.formatInline(listItem[3])}</li>`);
        continue;
      }

      closeList();
      paragraph.push(line);
    }

    flushParagraph();
    closeList();

    return this.sanitizer.sanitize(SecurityContext.HTML, blocks.join('')) ?? '';
  }

  private formatInline(text: string): string {
    return this.escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
