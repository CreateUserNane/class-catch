import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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

interface RecentLesson {
  lesson: Lesson;
  classId: number;
  className: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, AppShell],
  templateUrl: './student-overview.html',
  styleUrl: './student-overview.css',
})
export class StudentDashboard implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly classAccent = classAccentToken;
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly classes = signal<SchoolClass[]>([]);
  protected readonly recentLessons = signal<RecentLesson[]>([]);
  protected readonly totalLessonCount = signal(0);
  protected readonly approvedCount = computed(() => this.classes().filter((item) => item.membership_status === 'approved').length);
  protected readonly pendingCount = computed(() => this.classes().filter((item) => item.membership_status === 'pending').length);

  ngOnInit(): void {
    this.classService.getJoinedClasses().subscribe({
      next: (classes) => {
        this.classes.set(classes);
        const approved = classes.filter((item) => item.membership_status === 'approved');
        if (approved.length === 0) {
          this.loading.set(false);
          return;
        }
        forkJoin(approved.map((schoolClass) =>
          this.classService.getLessons(schoolClass.id).pipe(
            map((lessons) => lessons.map((lesson) => ({ lesson, classId: schoolClass.id, className: schoolClass.name }))),
            catchError(() => of([] as RecentLesson[])),
          ),
        )).subscribe({
          next: (groups) => {
            const allLessons = groups.flat();
            this.totalLessonCount.set(allLessons.length);
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
