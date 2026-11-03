import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ClassService } from '../../services/class.service';
import { Lesson } from '../../models/lesson';
import { LessonFile } from '../../models/lesson-file';
import { SchoolClass } from '../../models/class';
import { User } from '../../models/user';
import { AppShell } from '../../shared/shell/shell';
import { InitialsPipe } from '../../shared/pipes/initials';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-student-class',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, AppShell, InitialsPipe],
  templateUrl: './student-class.html',
  styleUrl: './student-class.css',
})
export class StudentClass implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly user = this.authService.user;

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly schoolClass = signal<SchoolClass | null>(null);
  protected readonly lessons = signal<Lesson[]>([]);
  protected readonly classmates = signal<User[]>([]);
  protected readonly activeTab = signal<'lessons' | 'classmates'>('lessons');

  protected readonly className = computed(() => this.schoolClass()?.name ?? 'Class');
  protected readonly classCode = computed(() => this.schoolClass()?.code ?? '');
  protected readonly description = computed(() => this.schoolClass()?.description ?? '');
  protected readonly teacherName = computed(() => this.schoolClass()?.teacher?.name ?? 'Teacher');
  protected readonly representative = computed(() => this.schoolClass()?.representative ?? null);
  protected readonly studentCount = computed(() => this.classmates().length);

  protected readonly isRepresentative = computed(() => {
    const user = this.user();
    const schoolClass = this.schoolClass();

    if (!user || !schoolClass) {
      return false;
    }

    return schoolClass.representative_id === user.id || schoolClass.representative?.id === user.id;
  });

  protected readonly summaryCount = computed(
    () => this.lessons().filter((lesson) => !!lesson.summary).length,
  );

  protected readonly photoCount = computed(() =>
    this.lessons().reduce(
      (total, lesson) => total + (lesson.files ?? []).filter((file) => file.type === 'photo').length,
      0,
    ),
  );

  ngOnInit(): void {
    const subscription = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));

      if (id) {
        this.loadClass(id);
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected setActiveTab(tab: 'lessons' | 'classmates'): void {
    this.activeTab.set(tab);
  }

  protected copyCode(): void {
    const code = this.classCode();

    if (!code) {
      return;
    }

    navigator.clipboard
      .writeText(code)
      .then(() => this.toast.show(`Class code ${code} copied!`))
      .catch(() => this.toast.show(`Class code: ${code}`));
  }

  protected materialCount(lesson: Lesson): number {
    return (lesson.files ?? []).filter((file) => file.type === 'material').length;
  }

  protected photoCountFor(lesson: Lesson): number {
    return (lesson.files ?? []).filter((file) => file.type === 'photo').length;
  }

  private loadClass(classId: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      schoolClass: this.classService.getClass(classId),
      classmates: this.classService.getClassMembers(classId),
      lessons: this.classService.getLessons(classId),
    }).subscribe({
      next: ({ schoolClass, classmates, lessons }) => {
        this.schoolClass.set(schoolClass);
        this.classmates.set(classmates);
        this.lessons.set(lessons);
        this.loading.set(false);

        this.loadLessonDetails(lessons);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message || 'Could not load this class.');
      },
    });
  }

  private loadLessonDetails(lessons: Lesson[]): void {
    if (lessons.length === 0) {
      return;
    }

    forkJoin(
      lessons.map((lesson) =>
        this.classService.getLesson(lesson.id).pipe(
          catchError(() => of({ ...lesson, files: [] as LessonFile[], summary: null } satisfies Lesson)),
        ),
      ),
    ).subscribe({
      next: (detailed) => this.lessons.set(detailed),
      error: () => this.lessons.set(lessons),
    });
  }
}
