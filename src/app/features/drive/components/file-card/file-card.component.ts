import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DriveFile } from '../../../../core/services/drive-file.service';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { FileTypeIconPipe } from '../../../../shared/pipes/file-type-icon.pipe';

@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, SkeletonModule, FileSizePipe, FileTypeIconPipe],
  templateUrl: './file-card.component.html',
  styleUrl: './file-card.component.scss',
})
export class FileCardComponent {
  @Input() file!: DriveFile;
  @Input() selected = false;
  @Output() preview = new EventEmitter<DriveFile>();
  @Output() download = new EventEmitter<DriveFile>();
  @Output() trash = new EventEmitter<DriveFile>();
  @Output() rename = new EventEmitter<DriveFile>();

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
}
