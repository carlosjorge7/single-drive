import { Component, EventEmitter, HostListener, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drag-drop-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="drag-overlay">
        <div class="drag-content">
          <i class="pi pi-cloud-upload"></i>
          <p>Suelta aquí para subir</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .drag-overlay {
      position: fixed;
      inset: 0;
      background: rgba(99, 102, 241, 0.12);
      border: 3px dashed #6366f1;
      border-radius: 1rem;
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      pointer-events: none;
      margin: 0.5rem;
    }
    .drag-content {
      text-align: center;
      color: #6366f1;
      i { font-size: 3rem; display: block; margin-bottom: 0.75rem; }
      p { font-size: 1.25rem; font-weight: 600; margin: 0; }
    }
  `],
})
export class DragDropOverlayComponent {
  @Output() filesDropped = new EventEmitter<File[]>();

  visible = signal(false);
  private dragCounter = 0;

  @HostListener('window:dragenter', ['$event'])
  onDragEnter(e: DragEvent) {
    if (e.dataTransfer?.types.includes('Files')) {
      this.dragCounter++;
      this.visible.set(true);
    }
  }

  @HostListener('window:dragleave', ['$event'])
  onDragLeave() {
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.visible.set(false);
    }
  }

  @HostListener('window:dragover', ['$event'])
  onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  @HostListener('window:drop', ['$event'])
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragCounter = 0;
    this.visible.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) this.filesDropped.emit(files);
  }
}
