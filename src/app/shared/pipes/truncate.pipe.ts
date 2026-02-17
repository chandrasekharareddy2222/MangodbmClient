import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncate Pipe
 * 
 * Architecture Decision: Pure pipe for text truncation
 * - Reusable across application
 * - Pure pipe for performance (memoization)
 * - Usage: {{ text | truncate:50:'...' }}
 */

@Pipe({
  name: 'truncate',
  standalone: true,
  pure: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 50, ellipsis: string = '...'): string {
    if (!value) {
      return '';
    }

    if (value.length <= limit) {
      return value;
    }

    return value.substring(0, limit) + ellipsis;
  }
}
