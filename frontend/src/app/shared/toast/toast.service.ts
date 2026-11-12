import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly notificationSignal = signal<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly notification = this.notificationSignal.asReadonly();

  show(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.notificationSignal.set({ message, type });
    this.timer = setTimeout(() => this.notificationSignal.set(null), type === 'error' ? 5000 : 3200);
  }

  error(message: string): void { this.show(message, 'error'); }
  info(message: string): void { this.show(message, 'info'); }

  dismiss(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.notificationSignal.set(null);
  }
}
