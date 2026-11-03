import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SavedLessonsService } from '../../services/saved-lessons.service';
import { StudentLessonEntry, StudentWorkspaceService } from '../../services/student-workspace.service';
import { LessonFile } from '../../models/lesson-file';
import { AppShell } from '../../shared/shell/shell';
import { ToastService } from '../../shared/toast/toast.service';

type StudentHubPage = 'lessons' | 'requests' | 'saved';

interface PendingPhotoEntry {
  file: LessonFile;
  className: string;
  lessonTitle: string;
}

@Component({
  selector: 'app-student-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, AppShell],
  templateUrl: './student-hub.html',
  styleUrl: './student-hub.css',
})
export class StudentHub implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly workspaceService = inject(StudentWorkspaceService);
  protected readonly savedService = inject(SavedLessonsService);
  private readonly toast = inject(ToastService);

  protected readonly user = this.auth.user;
  protected readonly page = signal<StudentHubPage>('lessons');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly classes = signal<StudentLessonEntry['schoolClass'][]>([]);
  protected readonly lessons = signal<StudentLessonEntry[]>([]);
  protected readonly savedIds = this.savedService.savedIds;

  protected readonly title = computed(() => ({
    lessons: 'Lessons',
    requests: 'Pending Requests',
    saved: 'Saved Lessons',
  })[this.page()]);

  protected readonly description = computed(() => ({
    lessons: 'Browse lessons and catch-up materials from your approved classes.',
    requests: 'Track class join requests and classroom photos waiting for teacher review.',
    saved: 'Your bookmarked lessons, ready to revisit.',
  })[this.page()]);

  protected readonly visibleLessons = computed(() => {
    const items = this.lessons().slice().sort((a, b) => b.lesson.created_at.localeCompare(a.lesson.created_at));
    return this.page() === 'saved' ? items.filter((entry) => this.savedIds().includes(entry.lesson.id)) : items;
  });

  protected readonly pendingClasses = computed(() =>
    this.classes().filter((schoolClass) => schoolClass.membership_status === 'pending'),
  );

  protected readonly pendingPhotos = computed<PendingPhotoEntry[]>(() => {
    const userId = Number(this.user()?.id);
    return this.lessons().flatMap(({ lesson, schoolClass }) =>
      (lesson.files ?? [])
        .filter((file) => file.type === 'photo' && file.status === 'pending' && Number(file.uploaded_by) === userId)
        .map((file) => ({ file, className: schoolClass.name, lessonTitle: lesson.title })),
    );
  });

  ngOnInit(): void {
    this.savedService.refresh();
    this.route.data.subscribe((data) => {
      const page = data['studentHubPage'];
      if (page === 'lessons' || page === 'requests' || page === 'saved') this.page.set(page);
    });
    this.load();
  }

  protected openLesson(lessonId: number): void {
    this.router.navigate(['/lessons', lessonId]);
  }

  protected toggleSaved(entry: StudentLessonEntry): void {
    const saved = this.savedService.toggle(entry.lesson.id);
    this.toast.show(saved ? 'Lesson saved for later.' : 'Lesson removed from Saved Lessons.');
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.workspaceService.load().subscribe({
      next: (workspace) => {
        this.classes.set(workspace.classes);
        this.lessons.set(workspace.lessons);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not load this page.');
        this.loading.set(false);
      },
    });
  }
}
