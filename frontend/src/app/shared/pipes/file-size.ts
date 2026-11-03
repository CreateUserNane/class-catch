import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || value < 0) {
      return '—';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = value;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }

    const decimals = size < 10 && index > 0 ? 1 : 0;

    return `${size.toFixed(decimals)} ${units[index]}`;
  }
}
