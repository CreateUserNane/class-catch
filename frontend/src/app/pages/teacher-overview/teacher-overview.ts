import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ClassService } from '../../services/class.service';
import { Lesson } from '../../models/lesson';
import { SchoolClass } from '../../models/class';
import { AppShell } from '../../shared/shell/shell';
import { classAccentToken } from '../../shared/class-accent';
import { RealtimeService } from '../../services/realtime.service';
import { Subscription } from 'rxjs';

interface RecentLesson {
  lesson: Lesson;
  classId: number;
  className: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, AppShell],
  templateUrl: './teacher-overview.html',
  styleUrl: './teacher-overview.css',
})
export class TeacherDashboard implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly router = inject(Router);
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private realtimeSubscriptions = new Subscription();

  protected readonly user = this.auth.user;
  protected readonly classAccent = classAccentToken;
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly classes = signal<SchoolClass[]>([]);
  protected readonly recentLessons = signal<RecentLesson[]>([]);
  protected readonly studentCount = computed(() => this.classes().reduce((sum, item) => sum + (item.students_count ?? 0), 0));
  protected readonly pendingCount = computed(() => this.classes().reduce((sum, item) => sum + (item.pending_requests_count ?? 0), 0));

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.realtimeSubscriptions.unsubscribe());
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.classService.getClasses().subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.realtimeSubscriptions.unsubscribe();
        this.realtimeSubscriptions = new Subscription();
        for (const schoolClass of classes) {
          this.realtimeSubscriptions.add(this.realtime.watchClass(schoolClass.id).subscribe(() => this.loadDashboard()));
        }
        if (classes.length === 0) {
          this.loading.set(false);
          return;
        }
        forkJoin(classes.map((schoolClass) =>
          this.classService.getLessons(schoolClass.id).pipe(
            map((lessons) => lessons.map((lesson) => ({ lesson, classId: schoolClass.id, className: schoolClass.name }))),
            catchError(() => of([] as RecentLesson[])),
          ),
        )).subscribe({
          next: (groups) => {
            const allLessons = groups.flat();
            this.recentLessons.set(allLessons.sort((a, b) => b.lesson.created_at.localeCompare(a.lesson.created_at)).slice(0, 6));
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not load your dashboard.');
        this.loading.set(false);
      },
    });
  }

  protected openLesson(lessonId: number): void {
    this.router.navigate(['/lessons', lessonId]);
  }
}
