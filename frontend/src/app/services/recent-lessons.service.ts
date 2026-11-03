import { Injectable, signal } from '@angular/core';

export interface RecentLessonVisit {
  lessonId: number;
  viewedAt: number;
}

const STORAGE_KEY_PREFIX = 'classcatch.recentLessons';
const MAX_VISITS = 12;

@Injectable({ providedIn: 'root' })
export class RecentLessonsService {
  readonly visits = signal<RecentLessonVisit[]>([]);
  private loadedUserId: number | null = null;

  loadForUser(userId: number): void {
    if (!Number.isFinite(userId) || userId <= 0 || this.loadedUserId === userId) return;
    this.loadedUserId = userId;
    this.visits.set(this.readStoredVisits(userId));
  }

  record(lessonId: number, userId: number): void {
    if (!Number.isFinite(lessonId) || lessonId <= 0) return;
    this.loadForUser(userId);

    const next = [
      { lessonId, viewedAt: Date.now() },
      ...this.visits().filter((visit) => visit.lessonId !== lessonId),
    ].slice(0, MAX_VISITS);

    this.visits.set(next);

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey(userId), JSON.stringify(next));
      }
    } catch {
      // Keep the in-memory history if browser storage is unavailable.
    }
  }

  private readStoredVisits(userId: number): RecentLessonVisit[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const value: unknown = JSON.parse(localStorage.getItem(this.storageKey(userId)) ?? '[]');
      if (!Array.isArray(value)) return [];

      return value
        .filter((visit): visit is RecentLessonVisit =>
          !!visit && Number.isFinite(visit.lessonId) && visit.lessonId > 0 && Number.isFinite(visit.viewedAt),
        )
        .slice(0, MAX_VISITS);
    } catch {
      return [];
    }
  }

  private storageKey(userId: number): string {
    return `${STORAGE_KEY_PREFIX}.${userId}`;
  }
}
