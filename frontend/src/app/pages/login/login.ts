import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email: email ?? '', password: password ?? '' }).subscribe({
      next: () => {
        this.loading.set(false);
        const role = this.authService.user()?.role;
        this.router.navigateByUrl(role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student');
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message || 'Login failed. Please check your credentials.');
      },
    });
  }
}
