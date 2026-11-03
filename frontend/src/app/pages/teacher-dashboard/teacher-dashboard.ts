import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClassService } from '../../services/class.service';
import { SchoolClass } from '../../models/class';
import { AppShell } from '../../shared/shell/shell';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [ReactiveFormsModule, AppShell],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.css',
})
export class TeacherDashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly user = this.authService.user;
  protected readonly classes = signal<SchoolClass[]>([]);
  protected readonly loading = signal(false);
  protected readonly creating = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly modalOpen = signal(false);

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  ngOnInit(): void {
    this.loadClasses();
  }

  protected openCreateModal(): void {
    this.form.reset();
    this.errorMessage.set('');
    this.modalOpen.set(true);
  }

  protected closeCreateModal(): void {
    this.modalOpen.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.errorMessage.set('');

    const value = this.form.getRawValue();

    this.classService
      .createClass({
        name: value.name ?? '',
        description: value.description ?? '',
      })
      .subscribe({
        next: (schoolClass) => {
          this.classes.update((classes) => [schoolClass, ...classes]);
          this.creating.set(false);
          this.modalOpen.set(false);
          this.form.reset();
          this.toast.show(`Class "${schoolClass.name}" created successfully.`);
        },
        error: (error) => {
          this.creating.set(false);
          this.errorMessage.set(error?.error?.message || 'Could not create class.');
        },
      });
  }

  protected copyCode(code: string): void {
    navigator.clipboard
      .writeText(code)
      .then(() => this.toast.show(`Class code ${code} copied!`))
      .catch(() => this.toast.show(`Class code: ${code}`));
  }

  protected viewClass(classId: number): void {
    this.router.navigate(['/classes', classId]);
  }

  private loadClasses(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.classService.getClasses().subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message || 'Could not load classes.');
      },
    });
  }
}
