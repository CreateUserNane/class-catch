import { Component, DestroyRef, HostListener, OnInit, computed, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InitialsPipe } from '../pipes/initials';
import { ClassService } from '../../services/class.service';
import { SchoolClass } from '../../models/class';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, InitialsPipe],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class AppShell implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly role = input.required<'teacher' | 'student'>();
  readonly activeClassId = input<number | null>(null);

  protected readonly user = this.authService.user;
  protected readonly currentUrl = signal(this.router.url);
  protected readonly logoutConfirmOpen = signal(false);
  protected readonly teacherClasses = signal<SchoolClass[]>([]);
  protected readonly teacherClassesLoading = signal(false);
  protected readonly classSwitcherOpen = signal(false);
  protected readonly classSwitcherValue = computed(() => {
    const id = this.activeClassId();
    return id && this.teacherClasses().some((schoolClass) => schoolClass.id === id) ? String(id) : '';
  });
  protected readonly classSwitcherLabel = computed(() => {
    if (this.teacherClassesLoading()) return 'Loading classes…';
    const activeClass = this.teacherClasses().find((schoolClass) => String(schoolClass.id) === this.classSwitcherValue());
    return activeClass?.name ?? (this.teacherClasses().length ? 'Switch class' : 'No classes yet');
  });

  ngOnInit(): void {
    if (this.role() !== 'teacher') return;

    this.teacherClassesLoading.set(true);
    this.classService.getClasses().subscribe({
      next: (classes) => {
        this.teacherClasses.set(classes);
        this.teacherClassesLoading.set(false);
      },
      error: () => {
        this.teacherClasses.set([]);
        this.teacherClassesLoading.set(false);
      },
    });
  }

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected dashboardLink(): string {
    return this.role() === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
  }

  protected classesLink(): string {
    return this.role() === 'teacher' ? '/dashboard/teacher/classes' : '/dashboard/student/classes';
  }

  protected isDashboardActive(): boolean {
    return this.normalizedPath() === this.dashboardLink();
  }

  protected isClassesActive(): boolean {
    const url = this.normalizedPath();
    const classDetailPrefix = this.role() === 'teacher' ? '/classes/' : '/student/classes/';
    return url.startsWith(this.classesLink()) || url.startsWith(classDetailPrefix);
  }

  protected isLessonsActive(): boolean {
    const url = this.normalizedPath();
    const lessonsLink = this.role() === 'teacher' ? '/dashboard/teacher/lessons' : '/dashboard/student/lessons';
    return url.startsWith(lessonsLink) || url.startsWith('/lessons/');
  }

  protected isSavedActive(): boolean {
    return this.normalizedPath().startsWith('/dashboard/student/saved');
  }

  protected isReviewActive(): boolean {
    return this.normalizedPath().startsWith('/dashboard/teacher/review');
  }

  private normalizedPath(): string {
    return this.currentUrl().split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  }

  protected openClasses(): void {
    void this.router.navigateByUrl(this.classesLink());
  }

  protected toggleClassSwitcher(): void {
    if (!this.teacherClassesLoading() && this.teacherClasses().length) {
      this.classSwitcherOpen.update((open) => !open);
    }
  }

  protected switchClass(id: number): void {
    this.classSwitcherOpen.set(false);
    if (id > 0) void this.router.navigate(['/classes', id]);
  }

  @HostListener('document:click')
  protected closeClassSwitcher(): void {
    this.classSwitcherOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected closeClassSwitcherOnEscape(): void {
    this.classSwitcherOpen.set(false);
  }

  protected requestLogout(): void {
    this.logoutConfirmOpen.set(true);
  }

  protected cancelLogout(): void {
    this.logoutConfirmOpen.set(false);
  }

  protected logout(): void {
    this.logoutConfirmOpen.set(false);
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
