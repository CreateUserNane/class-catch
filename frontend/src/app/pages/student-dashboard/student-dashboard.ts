import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ClassService } from '../../services/class.service';
import { Lesson } from '../../models/lesson';
import { LessonFile } from '../../models/lesson-file';
import { SchoolClass } from '../../models/class';
import { AppShell } from '../../shared/shell/shell';
import { ToastService } from '../../shared/toast/toast.service';

interface ClassWithLessons {
  schoolClass: SchoolClass;
  lessons: Lesson[];
}

@Component({
  selector: 'app-student-classes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppShell],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
})
export class StudentClasses implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly user = this.authService.user;

  protected classAccent(classId: number): string {
    const accents = ['indigo', 'emerald', 'amber', 'slate'];
    return accents[(Math.max(1, Math.trunc(classId)) - 1) % accents.length];
  }

  protected readonly classes = signal<SchoolClass[]>([]);
  protected readonly classLessons = signal<ClassWithLessons[]>([]);
  protected readonly totalClasses = computed(
    () => this.classes().filter((schoolClass) => schoolClass.membership_status === 'approved').length,
  );
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly joining = signal(false);

  protected readonly joinCode = signal('');

  protected readonly joinModalOpen = signal(false);

  protected readonly pendingClasses = computed(
    () => this.classes().filter((schoolClass) => schoolClass.membership_status === 'pending').length,
  );

  ngOnInit(): void {
    this.loadClasses();
  }

  protected openClass(classId: number): void {
    this.router.navigate(['/student/classes', classId]);
  }

  protected openJoinModal(code = ''): void {
    this.errorMessage.set('');
    this.joinCode.set(code);
    this.joinModalOpen.set(true);
  }

  protected closeJoinModal(): void {
    this.joinModalOpen.set(false);
    this.joinCode.set('');
  }

  protected copyCode(code: string): void {
    navigator.clipboard
      .writeText(code)
      .then(() => this.toast.show(`Class code ${code} copied!`))
      .catch(() => this.toast.show(`Class code: ${code}`));
  }

  protected lessonsForClass(classId: number): Lesson[] {
    return this.classLessons().find((item) => item.schoolClass.id === classId)?.lessons ?? [];
  }

  protected summariesForClass(classId: number): number {
    return this.lessonsForClass(classId).filter((lesson) => !!lesson.summary).length;
  }

  protected submitJoin(): void {
    const code = this.joinCode().trim().toUpperCase();

    if (!code) {
      return;
    }

    this.joining.set(true);
    this.errorMessage.set('');

    this.classService.joinClass(code).subscribe({
      next: () => {
        this.joining.set(false);
        this.joinCode.set('');
        this.joinModalOpen.set(false);
        this.loadClasses();
        this.toast.show('Join request sent. You can access the class after the teacher approves it.');
      },
      error: (error) => {
        this.joining.set(false);
        this.errorMessage.set(
          error?.error?.errors?.code?.[0] || error?.error?.message || 'Could not join the class.',
        );
      },
    });
  }

  private loadClasses(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.classService.getJoinedClasses().subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.classLessons.set(
          classes.map((schoolClass) => ({ schoolClass, lessons: [] as Lesson[] })),
        );

        classes
          .filter((schoolClass) => schoolClass.membership_status === 'approved')
          .forEach((schoolClass) => this.loadLessonsForClass(schoolClass));
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message || 'Could not load your classes.');
      },
    });
  }

  private loadLessonsForClass(schoolClass: SchoolClass): void {
    this.classService.getLessons(schoolClass.id).subscribe({
      next: (lessons) => {
        this.classLessons.update((items) =>
          items.map((item) => (item.schoolClass.id === schoolClass.id ? { ...item, lessons } : item)),
        );

        this.loadLessonDetails(schoolClass, lessons);
      },
      error: () => {
        this.classLessons.update((items) =>
          items.map((item) => (item.schoolClass.id === schoolClass.id ? { ...item, lessons: [] } : item)),
        );
      },
    });
  }

  protected loadLessonDetails(schoolClass: SchoolClass, lessons: Lesson[]): void {
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
      next: (detailed) => {
        this.classLessons.update((items) =>
          items.map((item) =>
            item.schoolClass.id === schoolClass.id ? { ...item, lessons: detailed } : item,
          ),
        );
      },
    });
  }
}
