import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly messageSignal = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly message = this.messageSignal.asReadonly();

  show(message: string): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.messageSignal.set(message);

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setTimeout(() => this.messageSignal.set(null), 3200);
  }

  dismiss(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.messageSignal.set(null);
  }
}
