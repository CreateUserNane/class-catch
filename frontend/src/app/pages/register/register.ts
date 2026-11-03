import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('password_confirmation')?.value;

  return password && confirmation && password !== confirmation
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly form = this.formBuilder.group(
    {
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
      role: ['student', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const value = this.form.getRawValue();

    this.authService
      .register({
        name: value.name ?? '',
        email: value.email ?? '',
        password: value.password ?? '',
        password_confirmation: value.password_confirmation ?? '',
        role: (value.role as 'teacher' | 'student') ?? 'student',
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          const role = this.authService.user()?.role;
          this.router.navigateByUrl(role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student');
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: unknown): string {
    const apiError = error as { error?: { message?: string; errors?: Record<string, string[]> } };

    if (apiError?.error?.errors) {
      const firstKey = Object.keys(apiError.error.errors)[0];
      if (firstKey) {
        return apiError.error.errors[firstKey][0];
      }
    }

    return apiError?.error?.message || 'Registration failed. Please try again.';
  }
}
