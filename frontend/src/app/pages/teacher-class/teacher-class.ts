import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ClassService } from '../../services/class.service';
import { LessonFile } from '../../models/lesson-file';
import { Lesson } from '../../models/lesson';
import { ClassJoinRequest, SchoolClass } from '../../models/class';
import { User } from '../../models/user';
import { AppShell } from '../../shared/shell/shell';
import { InitialsPipe } from '../../shared/pipes/initials';
import { FileSizePipe } from '../../shared/pipes/file-size';
import { ToastService } from '../../shared/toast/toast.service';

interface TeacherLessonView {
  lesson: Lesson;
  materials: LessonFile[];
  photos: LessonFile[];
}

@Component({
  selector: 'app-teacher-class',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AppShell, InitialsPipe, FileSizePipe],
  templateUrl: './teacher-class.html',
  styleUrl: './teacher-class.css',
})
export class TeacherClass implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly user = this.authService.user;
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly schoolClass = signal<SchoolClass | null>(null);
  protected readonly lessons = signal<TeacherLessonView[]>([]);
  protected readonly students = signal<User[]>([]);
  protected readonly joinRequests = signal<ClassJoinRequest[]>([]);
  protected readonly approvingRequestId = signal<number | null>(null);
  protected readonly joinRequestError = signal('');

  protected readonly activeTab = signal<'lessons' | 'students'>('lessons');
  protected readonly searchTerm = signal('');

  protected readonly lessonModalOpen = signal(false);
  protected readonly editingLessonId = signal<number | null>(null);
  protected readonly creatingLesson = signal(false);
  protected readonly lessonError = signal('');
  protected readonly selectedMaterialFile = signal<File | null>(null);
  protected readonly uploadError = signal('');

  protected readonly deleteLessonView = signal<TeacherLessonView | null>(null);
  protected readonly deletingLesson = signal(false);

  protected readonly assignTargetId = signal<number | null>(null);
  protected readonly assigningRepresentative = signal(false);
  protected readonly representativeMessage = signal('');

  protected readonly studentCount = computed(() => this.students().length);
  protected readonly pendingRequestCount = computed(() => this.joinRequests().length);
  protected readonly assignTarget = computed(() =>
    this.students().find((student) => student.id === this.assignTargetId()) ?? null,
  );
  protected readonly representative = computed(() => this.schoolClass()?.representative ?? null);

  protected readonly filteredStudents = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const students = this.students();

    if (!term) {
      return students;
    }

    return students.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(term));
  });

  protected readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  protected className(): string {
    return this.schoolClass()?.name ?? 'Class';
  }

  protected classCode(): string {
    return this.schoolClass()?.code ?? '';
  }

  protected teacherName(): string {
    return this.schoolClass()?.teacher?.name ?? this.user()?.name ?? 'Teacher';
  }

  protected openFileUrl(url: string | undefined): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  ngOnInit(): void {
    const subscription = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));

      if (id) {
        this.loadClass(id);
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected setActiveTab(tab: 'lessons' | 'students'): void {
    this.activeTab.set(tab);
  }

  protected changeRepresentative(): void {
    this.activeTab.set('students');
    setTimeout(() => document.getElementById('roster')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  protected copyCode(code: string): void {
    navigator.clipboard
      .writeText(code)
      .then(() => this.toast.show(`Class code ${code} copied!`))
      .catch(() => this.toast.show(`Class code: ${code}`));
  }

  protected approveJoinRequest(joinRequest: ClassJoinRequest): void {
    const classId = this.schoolClass()?.id;
    if (!classId || this.approvingRequestId() !== null) {
      return;
    }

    this.approvingRequestId.set(joinRequest.id);
    this.joinRequestError.set('');
    this.classService.approveJoinRequest(classId, joinRequest.id).subscribe({
      next: () => {
        this.approvingRequestId.set(null);
        this.toast.show(`${joinRequest.student.name} has been added to the class.`);
        this.loadClass(classId);
      },
      error: (error) => {
        this.approvingRequestId.set(null);
        this.joinRequestError.set(error?.error?.message || 'Could not approve this request.');
      },
    });
  }

  protected rejectJoinRequest(joinRequest: ClassJoinRequest): void {
    const classId = this.schoolClass()?.id;
    if (!classId || this.approvingRequestId() !== null) return;

    this.approvingRequestId.set(joinRequest.id);
    this.joinRequestError.set('');
    this.classService.rejectJoinRequest(classId, joinRequest.id).subscribe({
      next: () => {
        this.approvingRequestId.set(null);
        this.toast.show(`${joinRequest.student.name}'s request was rejected.`);
        this.loadClass(classId);
      },
      error: (error) => {
        this.approvingRequestId.set(null);
        this.joinRequestError.set(error?.error?.message || 'Could not reject this request.');
      },
    });
  }

  protected viewLesson(lessonId: number): void {
    this.router.navigate(['/lessons', lessonId]);
  }

  protected materialIcon(name: string): string {
    const lower = name.toLowerCase();

    if (lower.endsWith('.pdf')) {
      return 'picture_as_pdf';
    }

    if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
      return 'slideshow';
    }

    return 'description';
  }

  /* ---------- Lesson modal ---------- */

  protected openLessonModalCreate(): void {
    this.form.reset();
    this.selectedMaterialFile.set(null);
    this.uploadError.set('');
    this.lessonError.set('');
    this.editingLessonId.set(null);
    this.lessonModalOpen.set(true);
  }

  protected openLessonModalEdit(view: TeacherLessonView): void {
    this.form.setValue({
      title: view.lesson.title,
      description: view.lesson.description ?? '',
    });
    this.selectedMaterialFile.set(null);
    this.uploadError.set('');
    this.lessonError.set('');
    this.editingLessonId.set(view.lesson.id);
    this.lessonModalOpen.set(true);
  }

  protected closeLessonModal(): void {
    this.lessonModalOpen.set(false);
    this.editingLessonId.set(null);
    this.creatingLesson.set(false);
    this.selectedMaterialFile.set(null);
  }

  protected onSelectMaterialFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedMaterialFile.set(input.files?.[0] ?? null);
    input.value = '';
  }

  protected openMaterialFileInput(): void {
    document.getElementById('materialFile')?.click();
  }

  protected removeMaterial(file: LessonFile): void {
    this.classService.deleteFile(file.id).subscribe({
      next: () => {
        this.toast.show(`"${file.original_name}" removed from the lesson.`);
        this.refreshLessons();
      },
      error: (error) => {
        this.uploadError.set(error?.error?.message || 'Could not remove the file.');
      },
    });
  }

  protected submitLesson(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const classId = this.schoolClass()?.id;
    if (!classId) {
      return;
    }

    this.creatingLesson.set(true);
    this.lessonError.set('');

    const value = this.form.getRawValue();
    const payload = {
      title: value.title ?? '',
      description: value.description ?? '',
    };
    const stagedFile = this.selectedMaterialFile();

    const save$ = this.editingLessonId() !== null
      ? this.classService.updateLesson(this.editingLessonId() as number, payload)
      : this.classService.createLesson(classId, payload);

    const finalize = (lessonId: number): void => {
      if (stagedFile) {
        this.classService.uploadMaterial(lessonId, stagedFile).subscribe({
          next: () => this.finishLessonSave(),
          error: (error) => {
            this.creatingLesson.set(false);
            this.uploadError.set(error?.error?.message || 'Lesson saved, but the file could not be uploaded.');
            this.refreshLessons();
            this.toast.show('Lesson saved — the material upload failed.');
          },
        });
        return;
      }

      this.finishLessonSave();
    };

    save$.subscribe({
      next: (lesson) => finalize(lesson.id),
      error: (error) => {
        this.creatingLesson.set(false);
        this.lessonError.set(error?.error?.message || 'Could not save the lesson.');
      },
    });
  }

  private finishLessonSave(): void {
    this.creatingLesson.set(false);
    this.closeLessonModal();
    this.toast.show('Lesson saved successfully.');
    this.refreshLessons();
  }

  /* ---------- Delete lesson ---------- */

  protected openDeleteModal(view: TeacherLessonView): void {
    this.deleteLessonView.set(view);
  }

  protected closeDeleteModal(): void {
    this.deleteLessonView.set(null);
  }

  protected confirmDeleteLesson(): void {
    const view = this.deleteLessonView();
    if (!view) {
      return;
    }

    this.deletingLesson.set(true);

    this.classService.deleteLesson(view.lesson.id).subscribe({
      next: () => {
        this.deletingLesson.set(false);
        this.lessons.update((lessons) => lessons.filter((item) => item.lesson.id !== view.lesson.id));
        this.closeDeleteModal();
        this.toast.show('Lesson deleted successfully.');
      },
      error: (error) => {
        this.deletingLesson.set(false);
        this.toast.show(error?.error?.message || 'Could not delete the lesson.');
      },
    });
  }

  /* ---------- Representative ---------- */

  protected openAssignModal(student: User): void {
    if (student.id === this.representative()?.id) {
      return;
    }

    this.representativeMessage.set('');
    this.assignTargetId.set(student.id);
  }

  protected closeAssignModal(): void {
    this.assignTargetId.set(null);
  }

  protected confirmAssignment(): void {
    const classId = this.schoolClass()?.id;
    const studentId = this.assignTargetId();

    if (!classId || !studentId) {
      return;
    }

    this.assigningRepresentative.set(true);
    this.representativeMessage.set('');

    this.classService.assignRepresentative(classId, studentId).subscribe({
      next: (schoolClass) => {
        this.schoolClass.set(schoolClass);
        this.assigningRepresentative.set(false);
        this.closeAssignModal();
        this.toast.show(`${schoolClass.representative?.name ?? 'Student'} is now the assigned Student Representative.`);
      },
      error: (error) => {
        this.assigningRepresentative.set(false);
        this.representativeMessage.set(
          error?.error?.errors?.student_id?.[0] || error?.error?.message || 'Could not assign the representative.',
        );
      },
    });
  }

  /* ---------- Loading ---------- */

  private loadClass(classId: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      schoolClass: this.classService.getClass(classId),
      students: this.classService.getClassMembers(classId),
      joinRequests: this.classService.getJoinRequests(classId),
    }).subscribe({
      next: ({ schoolClass, students, joinRequests }) => {
        this.schoolClass.set(schoolClass);
        this.students.set(students);
        this.joinRequests.set(joinRequests);
        this.loading.set(false);
        this.refreshLessons();
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message || 'Could not load this class.');
      },
    });
  }

  private refreshLessons(): void {
    const classId = this.schoolClass()?.id;

    if (!classId) {
      return;
    }

    this.classService.getLessons(classId).subscribe({
      next: (lessons) => {
        forkJoin(
          lessons.map((lesson) =>
            this.classService.getLesson(lesson.id).pipe(
              catchError(() =>
                of({ ...lesson, files: [] as LessonFile[], summary: null } satisfies Lesson),
              ),
            ),
          ),
        ).subscribe({
          next: (views) => {
            this.lessons.set(
              views.map((lesson) => ({
                lesson,
                materials: (lesson.files ?? []).filter((file) => file.type === 'material'),
                photos: (lesson.files ?? []).filter((file) => file.type === 'photo'),
              })),
            );
          },
          error: () => this.lessons.set([]),
        });
      },
      error: () => this.lessons.set([]),
    });
  }
}
