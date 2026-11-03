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

  protected lessonsLink(): string {
    return this.role() === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
  }

  protected isDashboardActive(): boolean {
    return this.currentUrl().startsWith(this.dashboardLink());
  }

  protected isClassesActive(): boolean {
    return (
      this.currentUrl().startsWith('/classes') ||
      this.currentUrl().startsWith('/student/classes') ||
      this.currentUrl().startsWith('/lessons')
    );
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
