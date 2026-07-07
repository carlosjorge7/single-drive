import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="empty-state">
      <i class="pi {{ icon }}"></i>
      <h3>{{ title }}</h3>
      <p *ngIf="message">{{ message }}</p>
      @if (actionLabel) {
        <button pButton [label]="actionLabel" [icon]="actionIcon" (click)="action.emit()"></button>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 4rem 2rem; gap: 0.75rem; text-align: center; color: var(--text-color-secondary);
    }
    .empty-state i { font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.45; }
    .empty-state h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-color); margin: 0; }
    .empty-state p { font-size: 0.875rem; margin: 0; max-width: 320px; line-height: 1.5; }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'pi-folder-open';
  @Input() title = 'Sin contenido';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() actionIcon = 'pi pi-upload';
  @Output() action = new EventEmitter<void>();
}
