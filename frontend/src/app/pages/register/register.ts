import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

const commonMistypedDomains = new Set([
  'gnail.com', 'gmai.com', 'gmal.com', 'gmial.com', 'gmail.con', 'gmail.cmo', 'gmail.comm', 'gmail.coms',
  'yaho.com', 'yahoo.con', 'yahoo.comm', 'outlok.com', 'outlook.con', 'hotmial.com', 'hotmail.con',
]);

function emailDomainValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at < 1) return null;

  const domain = value.slice(at + 1);
  if (commonMistypedDomains.has(domain)) return { emailDomainTypo: true };

  const labels = domain.split('.');
  const validDomain = labels.length >= 2 && labels.every((label) =>
    label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
  ) && /^[a-z]{2,63}$/.test(labels[labels.length - 1]);

  return validDomain ? null : { emailDomain: true };
}

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
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly form = this.formBuilder.group(
    {
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, emailDomainValidator]],
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
          this.authService.clearSession();
          this.toast.show('Registration complete. You can now log in with your account.');
          this.router.navigateByUrl('/login');
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
