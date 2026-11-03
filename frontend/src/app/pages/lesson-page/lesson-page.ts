import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClassService } from '../../services/class.service';
import { AiSummary } from '../../models/ai-summary';
import { Lesson } from '../../models/lesson';
import { LessonFile } from '../../models/lesson-file';
import { AppShell } from '../../shared/shell/shell';
import { FileSizePipe } from '../../shared/pipes/file-size';
import { MarkdownPipe } from '../../shared/pipes/markdown';
import { ToastService } from '../../shared/toast/toast.service';
import { UploadPhotoModal } from '../../shared/upload-photo-modal/upload-photo-modal';
import { classAccentToken } from '../../shared/class-accent';
import { RecentLessonsService } from '../../services/recent-lessons.service';

@Component({
  selector: 'app-lesson-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppShell, FileSizePipe, MarkdownPipe, UploadPhotoModal],
  templateUrl: './lesson-page.html',
  styleUrl: './lesson-page.css',
})
export class LessonPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly recentLessons = inject(RecentLessonsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly user = this.authService.user;
  protected readonly classAccent = classAccentToken;

  protected readonly lesson = signal<Lesson | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly generatingSummary = signal(false);
  protected readonly summaryError = signal('');

  protected readonly explanations = signal<Record<number, AiSummary>>({});
  protected readonly generatingExplanationId = signal<number | null>(null);
  protected readonly explanationErrorId = signal<number | null>(null);
  protected readonly moderatingPhotoId = signal<number | null>(null);
  protected readonly photoModerationErrorId = signal<number | null>(null);
  protected readonly deletingPhotoId = signal<number | null>(null);
  protected readonly photoDeleteErrorId = signal<number | null>(null);

  protected readonly uploadModalOpen = signal(false);
  protected readonly uploadingMaterial = signal(false);
  protected readonly materialUploadError = signal('');

  protected readonly shellRole = computed(() => this.user()?.role ?? 'student');

  protected readonly className = computed(() => this.lesson()?.school_class?.name ?? '');
  protected readonly teacher = computed(() => this.lesson()?.teacher ?? null);
  protected readonly description = computed(() => this.lesson()?.description ?? '');
  protected readonly lessonTitle = computed(() => this.lesson()?.title ?? '');
  protected readonly createdAt = computed(() => this.lesson()?.created_at ?? '');
  protected readonly summary = computed(() => this.lesson()?.summary ?? null);

  protected readonly materials = computed(() =>
    (this.lesson()?.files ?? []).filter((file) => file.type === 'material'),
  );
  protected readonly photos = computed(() =>
    (this.lesson()?.files ?? []).filter((file) => file.type === 'photo'),
  );

  protected readonly canGenerateSummary = computed(() => {
    const lesson = this.lesson();
    const user = this.user();

    return !!lesson && !!user && user.role === 'teacher' && lesson.teacher_id === user.id;
  });

  protected readonly canModeratePhotos = computed(() => {
    const lesson = this.lesson();
    const user = this.user();

    return !!lesson && !!user && user.role === 'teacher' && lesson.teacher_id === user.id;
  });

  protected readonly canUploadPhoto = computed(() => {
    const lesson = this.lesson();
    const user = this.user();

    if (!lesson || !user) {
      return false;
    }

    const isTeacher = user.role === 'teacher' && Number(lesson.teacher_id) === Number(user.id);
    const representativeId = lesson.school_class?.representative_id ?? lesson.school_class?.representative?.id;
    const isRepresentative = user.role === 'student' && Number(representativeId) === Number(user.id);

    return isTeacher || isRepresentative;
  });

  protected readonly canGenerateExplanation = computed(() => {
    const lesson = this.lesson();
    const user = this.user();

    if (!lesson || !user) {
      return false;
    }

    const isTeacher = user.role === 'teacher' && Number(lesson.teacher_id) === Number(user.id);
    const representativeId = lesson.school_class?.representative_id ?? lesson.school_class?.representative?.id;
    const isRepresentative = user.role === 'student' && Number(representativeId) === Number(user.id);

    return isTeacher || isRepresentative;
  });

  protected readonly lessonId = computed(() => this.lesson()?.id ?? null);

  ngOnInit(): void {
    const subscription = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));

      if (id) {
        this.loadLesson(id);
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected backToClass(): void {
    const lesson = this.lesson();
    const role = this.user()?.role;

    if (lesson?.school_class) {
      const classId = lesson.school_class.id;

      if (classId) {
        this.router.navigate(role === 'teacher' ? ['/classes', classId] : ['/student/classes', classId]);
        return;
      }
    }

    this.router.navigate(['/dashboard/teacher']);
  }

  protected backToClassLink(): string[] {
    const lesson = this.lesson();
    const classId = lesson?.school_class?.id;

    if (classId && this.user()?.role === 'teacher') {
      return ['/classes', String(classId)];
    }

    if (classId) {
      return ['/student/classes', String(classId)];
    }

    return ['/dashboard/teacher'];
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  protected materialIcon(name: string): string {
    const lower = name.toLowerCase();

    if (lower.endsWith('.pdf')) {
      return 'picture_as_pdf';
    }

    if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
      return 'slideshow';
    }

    if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
      return 'description';
    }

    return 'insert_drive_file';
  }

  protected generateSummary(): void {
    const lessonId = this.lessonId();

    if (!lessonId) {
      return;
    }

    this.generatingSummary.set(true);
    this.summaryError.set('');

    this.classService.generateSummary(lessonId).subscribe({
      next: (summary) => {
        this.generatingSummary.set(false);
        this.lesson.update((current) => (current ? { ...current, summary } : current));
        this.toast.show('AI lesson summary generated successfully.');
      },
      error: (error) => {
        this.generatingSummary.set(false);
        this.summaryError.set(error?.error?.message || 'Could not generate the lesson summary.');
      },
    });
  }

  protected generateExplanation(file: LessonFile): void {
    const fileId = file.id;

    if (this.generatingExplanationId() === fileId) {
      return;
    }

    this.generatingExplanationId.set(fileId);
    this.explanationErrorId.set(null);

    this.classService.generateExplanation(fileId).subscribe({
      next: (explanation) => {
        this.explanations.update((current) => ({ ...current, [fileId]: explanation }));
        this.generatingExplanationId.set(null);
        this.toast.show('AI explanation generated successfully.');
      },
      error: (error) => {
        this.generatingExplanationId.set(null);
        this.explanationErrorId.set(fileId);
        console.error('[LessonPage] explanation error', error);
      },
    });
  }

  protected moderatePhoto(file: LessonFile, status: 'approved' | 'rejected'): void {
    if (!this.canModeratePhotos() || this.moderatingPhotoId() !== null) {
      return;
    }

    this.moderatingPhotoId.set(file.id);
    this.photoModerationErrorId.set(null);
    this.classService.moderatePhoto(file.id, status).subscribe({
      next: (updatedFile) => {
        this.moderatingPhotoId.set(null);
        this.lesson.update((current) => current
          ? { ...current, files: (current.files ?? []).map((item) => item.id === updatedFile.id ? updatedFile : item) }
          : current);
        this.toast.show(status === 'approved'
          ? 'Photo approved and published. Regenerate the lesson summary to include it.'
          : 'Photo rejected. It is hidden from the class.');
      },
      error: (error) => {
        this.moderatingPhotoId.set(null);
        this.photoModerationErrorId.set(file.id);
        this.toast.show(error?.error?.message || 'Could not update the photo review.');
      },
    });
  }

  protected deletePhoto(file: LessonFile): void {
    if (!this.canModeratePhotos() || file.type !== 'photo' || this.deletingPhotoId() !== null) {
      return;
    }

    if (!window.confirm(`Delete "${file.original_name}" from this lesson?`)) {
      return;
    }

    this.deletingPhotoId.set(file.id);
    this.photoDeleteErrorId.set(null);
    this.classService.deleteFile(file.id).subscribe({
      next: () => {
        this.deletingPhotoId.set(null);
        this.lesson.update((current) => current
          ? { ...current, files: (current.files ?? []).filter((item) => item.id !== file.id) }
          : current);
        this.explanations.update((current) => {
          const next = { ...current };
          delete next[file.id];
          return next;
        });
        this.toast.show('Photo removed from the lesson.');
      },
      error: (error) => {
        this.deletingPhotoId.set(null);
        this.photoDeleteErrorId.set(file.id);
        this.toast.show(error?.error?.message || 'Could not delete this photo.');
      },
    });
  }

  protected explanationFor(file: LessonFile): AiSummary | null {
    return this.explanations()[file.id] ?? null;
  }

  protected openFile(url: string | undefined): void {
    if (!url) {
      return;
    }

    window.open(url, '_blank');
  }

  protected openUploadModal(): void {
    this.uploadModalOpen.set(true);
  }

  protected uploadPowerPoint(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!/\.pptx?$/i.test(file.name)) {
      this.materialUploadError.set('Choose a PowerPoint file (.ppt or .pptx).');
      return;
    }

    const lessonId = this.lessonId();
    if (!lessonId) {
      return;
    }

    this.uploadingMaterial.set(true);
    this.materialUploadError.set('');
    this.classService.uploadMaterial(lessonId, file).subscribe({
      next: () => {
        this.uploadingMaterial.set(false);
        this.toast.show('PowerPoint uploaded to lesson materials.');
        this.loadLesson(lessonId);
      },
      error: (error) => {
        this.uploadingMaterial.set(false);
        this.materialUploadError.set(error?.error?.message || 'Could not upload the PowerPoint.');
      },
    });
  }

  protected closeUploadModal(): void {
    this.uploadModalOpen.set(false);
  }

  protected onPhotoUploaded(): void {
    this.uploadModalOpen.set(false);

    const lessonId = this.lessonId();

    if (lessonId) {
      this.loadLesson(lessonId);
    }
  }

  private loadLesson(lessonId: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.classService.getLesson(lessonId).subscribe({
      next: (lesson) => {
        this.lesson.set(lesson);
        const user = this.user();
        if (user?.role === 'student') {
          this.recentLessons.record(lesson.id, user.id);
        }
        this.loading.set(false);

        this.loadExplanations(lesson);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message || 'Could not load this lesson.');
      },
    });
  }

  private loadExplanations(lesson: Lesson): void {
    const photoFiles = (lesson.files ?? []).filter((file) => file.type === 'photo' && file.status === 'approved');

    photoFiles.forEach((file) => {
      this.classService.getExplanation(file.id).subscribe({
        next: (explanation) => {
          this.explanations.update((current) => ({ ...current, [file.id]: explanation }));
        },
        error: () => {
          // No explanation yet — the teacher or representative can generate one.
        },
      });
    });
  }
}
