import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClassJoinRequest, SchoolClass } from '../../models/class';
import { LessonFile } from '../../models/lesson-file';
import { TeacherJoinRequestEntry, TeacherLessonEntry, TeacherWorkspaceService } from '../../services/teacher-workspace.service';
import { ClassService } from '../../services/class.service';
import { AppShell } from '../../shared/shell/shell';
import { ToastService } from '../../shared/toast/toast.service';

type TeacherHubPage = 'lessons' | 'review';

interface PendingPhotoEntry {
  file: LessonFile;
  lessonId: number;
  lessonTitle: string;
  schoolClass: SchoolClass;
}

@Component({
  selector: 'app-teacher-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, AppShell],
  templateUrl: './teacher-hub.html',
  styleUrl: './teacher-hub.css',
})
export class TeacherHub implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceService = inject(TeacherWorkspaceService);
  private readonly classService = inject(ClassService);
  private readonly toast = inject(ToastService);

  protected readonly page = signal<TeacherHubPage>('lessons');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly lessons = signal<TeacherLessonEntry[]>([]);
  protected readonly joinRequests = signal<TeacherJoinRequestEntry[]>([]);
  protected readonly busyRequestId = signal<number | null>(null);
  protected readonly busyPhotoId = signal<number | null>(null);

  protected readonly title = computed(() => this.page() === 'review' ? 'Review Queue' : 'Lessons');
  protected readonly description = computed(() => this.page() === 'review'
    ? 'Review student class join requests and classroom photos.'
    : 'Browse lessons and AI summaries across your classes.');

  protected readonly visibleLessons = computed(() => this.lessons()
    .slice()
    .sort((a, b) => b.lesson.created_at.localeCompare(a.lesson.created_at)));

  protected readonly pendingPhotos = computed<PendingPhotoEntry[]>(() =>
    this.lessons().flatMap(({ lesson, schoolClass }) =>
      (lesson.files ?? [])
        .filter((file) => file.type === 'photo' && file.status === 'pending')
        .map((file) => ({ file, lessonId: lesson.id, lessonTitle: lesson.title, schoolClass })),
    ),
  );

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const page = data['teacherHubPage'];
      if (page === 'lessons' || page === 'review') this.page.set(page);
    });
    this.load();
  }

  protected openLesson(lessonId: number): void {
    this.router.navigate(['/lessons', lessonId]);
  }

  protected openClass(classId: number): void {
    this.router.navigate(['/classes', classId]);
  }

  protected approveJoinRequest(entry: TeacherJoinRequestEntry): void {
    if (this.busyRequestId() !== null) return;
    this.busyRequestId.set(entry.request.id);
    this.classService.approveJoinRequest(entry.schoolClass.id, entry.request.id).subscribe({
      next: (_request: ClassJoinRequest) => {
        this.joinRequests.update((items) => items.filter((item) => item.request.id !== entry.request.id));
        this.busyRequestId.set(null);
        this.toast.show(`${entry.request.student.name} joined ${entry.schoolClass.name}.`);
      },
      error: (error) => {
        this.busyRequestId.set(null);
        this.toast.show(error?.error?.message || 'Could not approve this join request.');
      },
    });
  }

  protected moderatePhoto(entry: PendingPhotoEntry, status: 'approved' | 'rejected'): void {
    if (this.busyPhotoId() !== null) return;
    this.busyPhotoId.set(entry.file.id);
    this.classService.moderatePhoto(entry.file.id, status).subscribe({
      next: () => {
        this.lessons.update((items) => items.map((item) => item.lesson.id === entry.lessonId
          ? { ...item, lesson: { ...item.lesson, files: (item.lesson.files ?? []).map((file) =>
              file.id === entry.file.id ? { ...file, status } : file,
            ) } }
          : item,
        ));
        this.busyPhotoId.set(null);
        this.toast.show(status === 'approved' ? 'Photo approved and published to the class.' : 'Photo rejected.');
      },
      error: (error) => {
        this.busyPhotoId.set(null);
        this.toast.show(error?.error?.message || 'Could not update this photo review.');
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.workspaceService.load().subscribe({
      next: (workspace) => {
        this.lessons.set(workspace.lessons);
        this.joinRequests.set(workspace.joinRequests);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.error?.message || 'Could not load your teaching workspace.');
        this.loading.set(false);
      },
    });
  }
}
