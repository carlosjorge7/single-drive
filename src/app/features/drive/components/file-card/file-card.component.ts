import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DriveFile } from '../../../../core/services/drive-file.service';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { FileTypeIconPipe } from '../../../../shared/pipes/file-type-icon.pipe';
import { SelectionService } from '../../../../core/services/selection.service';

@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, SkeletonModule, FileSizePipe, FileTypeIconPipe],
  templateUrl: './file-card.component.html',
  styleUrl: './file-card.component.scss',
})
export class FileCardComponent {
  constructor(public selection: SelectionService) {}
  @Input() file!: DriveFile;
  @Input() trashMode = false;
  @Output() preview = new EventEmitter<DriveFile>();
  @Output() download = new EventEmitter<DriveFile>();
  @Output() trash = new EventEmitter<DriveFile>();
  @Output() rename = new EventEmitter<DriveFile>();
  @Output() restore = new EventEmitter<DriveFile>();
  @Output() deletePermanent = new EventEmitter<DriveFile>();
  @Output() move = new EventEmitter<DriveFile>();

  get isProcessing(): boolean {
    return this.file.processing_status === 'pending' || this.file.processing_status === 'processing';
  }

  get hasThumbnail(): boolean {
    return !!this.file.thumbnail_small_url && !this.isProcessing;
  }

  get formattedDate(): string {
    const d = new Date(this.file.created_at);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onCardClick(): void {
    if (this.selection.hasSelection()) {
      this.selection.toggle(this.file.id);
    } else {
      this.preview.emit(this.file);
    }
  }

  onDragStart(event: DragEvent) {
    event.dataTransfer?.setData('application/homedrive-file', this.file.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }
}
