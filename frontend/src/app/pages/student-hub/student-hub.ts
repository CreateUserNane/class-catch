import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SavedLessonsService } from '../../services/saved-lessons.service';
import { StudentLessonEntry, StudentWorkspaceService } from '../../services/student-workspace.service';
import { AppShell } from '../../shared/shell/shell';
import { ToastService } from '../../shared/toast/toast.service';

type StudentHubPage = 'lessons' | 'saved';

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
  private readonly workspaceService = inject(StudentWorkspaceService);
  protected readonly savedService = inject(SavedLessonsService);
  private readonly toast = inject(ToastService);

  protected readonly page = signal<StudentHubPage>('lessons');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly lessons = signal<StudentLessonEntry[]>([]);
  protected readonly savedIds = this.savedService.savedIds;

  protected readonly title = computed(() => ({
    lessons: 'Lessons',
    saved: 'Saved Lessons',
  })[this.page()]);

  protected readonly description = computed(() => ({
    lessons: 'Browse lessons and catch-up materials from your approved classes.',
    saved: 'Your bookmarked lessons, ready to revisit.',
  })[this.page()]);

  protected readonly visibleLessons = computed(() => {
    const items = this.lessons().slice().sort((a, b) => b.lesson.created_at.localeCompare(a.lesson.created_at));
    return this.page() === 'saved' ? items.filter((entry) => this.savedIds().includes(entry.lesson.id)) : items;
  });

  ngOnInit(): void {
    this.savedService.refresh();
    this.route.data.subscribe((data) => {
      const page = data['studentHubPage'];
      if (page === 'lessons' || page === 'saved') this.page.set(page);
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
