import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toast.notification(); as notification) {
      <div class="toast-wrap" [class.toast-error-wrap]="notification.type === 'error'" [class.toast-info-wrap]="notification.type === 'info'">
        <div class="toast" [class.toast-error]="notification.type === 'error'" [class.toast-info]="notification.type === 'info'" [attr.role]="notification.type === 'error' ? 'alert' : 'status'" [attr.aria-live]="notification.type === 'error' ? 'assertive' : 'polite'">
          <span class="material-symbols-outlined" aria-hidden="true">{{ notification.type === 'error' ? 'error' : notification.type === 'info' ? 'info' : 'check_circle' }}</span>
          <span>{{ notification.message }}</span>
          <button type="button" class="toast-dismiss" (click)="toast.dismiss()" aria-label="Dismiss notification">×</button>
        </div>
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
