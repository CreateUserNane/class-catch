import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SavedLessonsService } from '../../services/saved-lessons.service';
import { StudentLessonEntry, StudentWorkspaceService } from '../../services/student-workspace.service';
import { AppShell } from '../../shared/shell/shell';
import { ToastService } from '../../shared/toast/toast.service';
import { classAccentToken } from '../../shared/class-accent';
import { RealtimeService } from '../../services/realtime.service';
import { Subscription } from 'rxjs';

type StudentHubPage = 'lessons' | 'saved';
type LessonResourceFilter = 'all' | 'powerpoint' | 'pdf' | 'documents' | 'photos';
type LessonDateOrder = 'newest' | 'oldest';

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
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private realtimeSubscriptions = new Subscription();

  protected readonly page = signal<StudentHubPage>('lessons');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly lessons = signal<StudentLessonEntry[]>([]);
  protected readonly savedIds = this.savedService.savedIds;
  protected readonly searchTerm = signal('');
  protected readonly selectedClass = signal('all');
  protected readonly resourceFilter = signal<LessonResourceFilter>('all');
  protected readonly dateOrder = signal<LessonDateOrder>('newest');
  protected readonly classAccent = classAccentToken;

  protected readonly title = computed(() => ({
    lessons: 'Lessons',
    saved: 'Saved Lessons',
  })[this.page()]);

  protected readonly description = computed(() => ({
    lessons: 'Browse lessons and catch-up materials from your approved classes.',
    saved: 'Your bookmarked lessons, ready to revisit.',
  })[this.page()]);

  protected readonly baseLessons = computed(() =>
    this.page() === 'saved'
      ? this.lessons().filter((entry) => this.savedIds().includes(entry.lesson.id))
      : this.lessons(),
  );

  protected readonly classOptions = computed(() => {
    const unique = new Map<number, string>();
    this.baseLessons().forEach(({ schoolClass }) => unique.set(schoolClass.id, schoolClass.name));
    return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly visibleLessons = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const selectedClass = this.selectedClass();
    const resource = this.resourceFilter();

    return this.baseLessons()
      .filter(({ lesson, schoolClass }) =>
        (!query || `${lesson.title} ${schoolClass.name} ${(lesson.files ?? []).map((file) => file.original_name).join(' ')}`.toLocaleLowerCase().includes(query)) &&
        (selectedClass === 'all' || schoolClass.id === Number(selectedClass)) &&
        this.hasResource(lesson.files ?? [], resource),
      )
      .sort((a, b) => this.dateOrder() === 'newest'
        ? b.lesson.created_at.localeCompare(a.lesson.created_at)
        : a.lesson.created_at.localeCompare(b.lesson.created_at));
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.realtimeSubscriptions.unsubscribe());
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

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.selectedClass.set('all');
    this.resourceFilter.set('all');
    this.dateOrder.set('newest');
  }

  private hasResource(files: NonNullable<StudentLessonEntry['lesson']['files']>, filter: LessonResourceFilter): boolean {
    if (filter === 'all') return true;
    return files.some((file) => {
      if (filter === 'photos') return file.type === 'photo';
      if (file.type !== 'material') return false;
      const name = file.original_name.toLowerCase();
      if (filter === 'powerpoint') return /\.(ppt|pptx)$/.test(name);
      if (filter === 'pdf') return name.endsWith('.pdf');
      return /\.(doc|docx)$/.test(name);
    });
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
        this.realtimeSubscriptions.unsubscribe();
        this.realtimeSubscriptions = new Subscription();
        for (const schoolClass of workspace.classes) {
          this.realtimeSubscriptions.add(this.realtime.watchClass(schoolClass.id).subscribe(() => this.load()));
        }
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
