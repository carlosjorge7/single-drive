import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectionService } from '../../../../core/services/selection.service';

@Component({
  selector: 'app-bulk-actions-bar',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    @if (selection.hasSelection()) {
      <div class="bulk-bar">
        <span class="bulk-count">
          <i class="pi pi-check-square"></i>
          {{ selection.count() }} seleccionado{{ selection.count() === 1 ? '' : 's' }}
        </span>
        <div class="bulk-actions">
          <button
            pButton type="button"
            icon="pi pi-download"
            label="Descargar"
            class="p-button-text p-button-sm"
            (click)="bulkDownload.emit(selection.getIds())"
          ></button>
          <button
            pButton type="button"
            icon="pi pi-arrow-right-arrow-left"
            label="Mover"
            class="p-button-text p-button-sm"
            (click)="bulkMove.emit(selection.getIds())"
          ></button>
          <button
            pButton type="button"
            icon="pi pi-trash"
            label="Eliminar"
            class="p-button-text p-button-sm p-button-danger"
            (click)="bulkTrash.emit(selection.getIds())"
          ></button>
        </div>
        <button
          pButton type="button"
          icon="pi pi-times"
          class="p-button-text p-button-sm bulk-close"
          pTooltip="Cancelar selección"
          (click)="selection.clear()"
        ></button>
      </div>
    }
  `,
  styles: [`
    .bulk-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--primary-color, #6366f1);
      color: #fff;
      border-radius: 0.5rem;
      margin-bottom: 0.75rem;
      animation: slideDown 0.15s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .bulk-count {
      font-weight: 600;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-right: 0.5rem;
    }
    .bulk-actions {
      display: flex;
      gap: 0.25rem;
      flex: 1;
    }
    .bulk-actions :deep(.p-button) {
      color: rgba(255,255,255,0.9) !important;
    }
    .bulk-actions :deep(.p-button:hover) {
      background: rgba(255,255,255,0.15) !important;
      color: #fff !important;
    }
    .bulk-actions :deep(.p-button-danger) {
      color: #fca5a5 !important;
    }
    .bulk-close {
      color: rgba(255,255,255,0.7) !important;
      margin-left: auto;
    }
    .bulk-close:hover {
      color: #fff !important;
    }
  `],
})
export class BulkActionsBarComponent {
  @Output() bulkTrash    = new EventEmitter<string[]>();
  @Output() bulkMove     = new EventEmitter<string[]>();
  @Output() bulkDownload = new EventEmitter<string[]>();

  constructor(public selection: SelectionService) {}
}
