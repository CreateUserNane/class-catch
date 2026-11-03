import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="dismissed.emit()">
        <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title">{{ title() }}</h3>
            <button type="button" class="icon-btn" (click)="dismissed.emit()" aria-label="Close">×</button>
          </header>
          <div class="modal-body">
            <ng-content />
          </div>
          <footer class="modal-footer">
            <ng-content select="[modalFooter]" />
          </footer>
        </div>
      </div>
    }
  `,
})
export class Modal {
  readonly open = input.required<boolean>();
  readonly title = input<string>('');
  readonly dismissed = output<void>();
}
