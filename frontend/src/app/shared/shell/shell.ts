import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InitialsPipe } from '../pipes/initials';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, InitialsPipe],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class AppShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly role = input.required<'teacher' | 'student'>();

  protected readonly user = this.authService.user;
  protected readonly currentUrl = signal(this.router.url);
  protected readonly logoutConfirmOpen = signal(false);

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
