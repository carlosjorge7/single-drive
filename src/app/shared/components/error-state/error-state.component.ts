import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="error-state">
      <i class="pi pi-exclamation-circle"></i>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button pButton [label]="retryLabel" icon="pi pi-refresh" class="p-button-outlined p-button-sm" (click)="retry.emit()"></button>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .error-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 4rem 2rem; gap: 0.75rem; text-align: center;
    }
    .error-state i { font-size: 3rem; color: var(--red-500, #ef4444); margin-bottom: 0.5rem; }
    .error-state h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-color); margin: 0; }
    .error-state p { font-size: 0.875rem; color: var(--text-color-secondary); margin: 0; }
  `]
})
export class ErrorStateComponent {
  @Input() title = 'Error al cargar';
  @Input() message = 'Algo ha ido mal. Intentalo de nuevo.';
  @Input() retryLabel = 'Reintentar';
  @Output() retry = new EventEmitter<void>();
}
