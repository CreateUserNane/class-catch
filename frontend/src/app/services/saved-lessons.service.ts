import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SavedLessonsService {
  private readonly auth = inject(AuthService);
  readonly savedIds = signal<number[]>([]);

  refresh(): void {
    this.savedIds.set(this.read());
  }

  toggle(lessonId: number): boolean {
    const ids = this.read();
    const isSaved = ids.includes(lessonId);
    const next = isSaved ? ids.filter((id) => id !== lessonId) : [...ids, lessonId];
    localStorage.setItem(this.storageKey(), JSON.stringify(next));
    this.savedIds.set(next);
    return !isSaved;
  }

  isSaved(lessonId: number): boolean {
    return this.savedIds().includes(lessonId);
  }

  private read(): number[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(this.storageKey()) ?? '[]');
      return Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id) && id > 0) : [];
    } catch {
      return [];
    }
  }

  private storageKey(): string {
    return `classcatch_saved_lessons_${this.auth.user()?.id ?? 'guest'}`;
  }
}
