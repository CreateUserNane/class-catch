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

    const escaped = this.escapeHtml(value);

    const html = escaped
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
      .replace(/^\*\s+(.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
      .replace(/^---$/gm, '<hr>')
      .replace(/\n{2,}/g, '<br><br>')
      .replace(/\n/g, '<br>');

    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, `<p>${html}</p>`) ?? '';

    return sanitized.replace(/<p>\s*<\/p>/g, '');
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
