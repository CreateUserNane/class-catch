import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toast.message()) {
      <div class="toast-wrap" role="status" aria-live="polite">
        <div class="toast">
          <span class="material-symbols-outlined">check_circle</span>
          <span>{{ toast.message() }}</span>
        </div>
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
