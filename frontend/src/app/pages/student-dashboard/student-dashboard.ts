import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ClassService } from '../../services/class.service';
import { Lesson } from '../../models/lesson';
import { LessonFile } from '../../models/lesson-file';
import { SchoolClass } from '../../models/class';
import { User } from '../../models/user';
import { AppShell } from '../../shared/shell/shell';
import { ToastService } from '../../shared/toast/toast.service';
import { UploadPhotoModal } from '../../shared/upload-photo-modal/upload-photo-modal';
import { PhotoLessonOption } from '../../shared/upload-photo-modal/upload-photo-modal';

interface ClassWithLessons {
  schoolClass: SchoolClass;
  lessons: Lesson[];
}

@Component({
  selector: 'app-student-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, AppShell, UploadPhotoModal],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
})
export class StudentDashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  protected readonly user = this.authService.user;

  protected readonly classes = signal<SchoolClass[]>([]);
  protected readonly classLessons = signal<ClassWithLessons[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly joining = signal(false);

  protected readonly joinCode = signal('');

  protected readonly joinModalOpen = signal(false);

  protected readonly uploadModalOpen = signal(false);

  protected readonly userId = computed(() => this.user()?.id);

  protected readonly totalClasses = computed(() => this.classes().length);

  protected readonly allLessons = computed(() =>
    this.classLessons().flatMap((item) => item.lessons),
  );

  protected readonly totalLessons = computed(() => this.allLessons().length);

  protected readonly summariesReady = computed(
    () => this.allLessons().filter((lesson) => !!lesson.summary).length,
  );

  protected readonly totalPhotos = computed(
    () =>
      this.allLessons().reduce(
        (total, lesson) => total + (lesson.files ?? []).filter((file) => file.type === 'photo').length,
        0,
      ),
  );

  protected readonly recentLessons = computed(() =>
    this.allLessons()
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6)
      .map((lesson) => ({
        lesson,
        className: lesson.school_class?.name ?? lesson.school_class?.code ?? '',
      })),
  );

  protected readonly isRepresentative = computed(() => {
    const userId = this.userId();

    if (!userId) {
      return false;
    }

    return this.classes().some(
      (schoolClass) =>
        schoolClass.representative_id === userId || schoolClass.representative?.id === userId,
    );
  });

  protected readonly representativeClasses = computed(() => {
    const userId = this.userId();

    if (!userId) {
      return [];
    }

    return this.classes().filter(
      (schoolClass) =>
        schoolClass.representative_id === userId || schoolClass.representative?.id === userId,
    );
  });

  protected readonly uploadLessons = computed<PhotoLessonOption[]>(() => {
    const representativeClasses = this.representativeClasses();
    const classIds = new Set(representativeClasses.map((schoolClass) => schoolClass.id));

    return this.classLessons()
      .filter((item) => classIds.has(item.schoolClass.id))
      .flatMap((item) => item.lessons)
      .map((lesson) => ({ id: lesson.id, title: lesson.title }));
  });

  protected readonly uploadDefaultLessonId = computed<number | null>(() => {
    const representativeClasses = this.representativeClasses();

    for (const schoolClass of representativeClasses) {
      const entry = this.classLessons().find(
        (item) => item.schoolClass.id === schoolClass.id,
      );
      const firstLesson = entry?.lessons[0];

      if (firstLesson) {
        return firstLesson.id;
      }
    }

    return null;
  });

  ngOnInit(): void {
    this.loadClasses();
  }

  protected openClass(classId: number): void {
    this.router.navigate(['/student/classes', classId]);
  }

  protected openJoinModal(): void {
    this.errorMessage.set('');
    this.joinCode.set('');
    this.joinModalOpen.set(true);
  }

  protected closeJoinModal(): void {
    this.joinModalOpen.set(false);
    this.joinCode.set('');
  }

  protected openLesson(lessonId: number): void {
    this.router.navigate(['/lessons', lessonId]);
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
        this.toast.show('You have joined the class successfully.');
      },
      error: (error) => {
        this.joining.set(false);
        this.errorMessage.set(
          error?.error?.errors?.code?.[0] || error?.error?.message || 'Could not join the class.',
        );
      },
    });
  }

  protected openUploadModal(): void {
    this.uploadModalOpen.set(true);
  }

  protected closeUploadModal(): void {
    this.uploadModalOpen.set(false);
  }

  protected onPhotoUploaded(): void {
    this.uploadModalOpen.set(false);

    for (const item of this.classLessons()) {
      this.classService.getLessons(item.schoolClass.id).subscribe({
        next: (lessons) => this.classLessons.update((items) =>
          items.map((entry) => (entry.schoolClass.id === item.schoolClass.id ? { ...entry, lessons } : entry)),
        ),
      });
    }

    this.loadClasses();
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

        classes.forEach((schoolClass) => this.loadLessonsForClass(schoolClass));
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
