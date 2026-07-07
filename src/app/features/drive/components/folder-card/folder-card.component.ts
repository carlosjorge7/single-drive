import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DriveFolder } from '../../../../core/services/folder.service';

@Component({
  selector: 'app-folder-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  templateUrl: './folder-card.component.html',
  styleUrl: './folder-card.component.scss',
})
export class FolderCardComponent {
  @Input() folder!: DriveFolder;
  @Output() open = new EventEmitter<DriveFolder>();
  @Output() rename = new EventEmitter<DriveFolder>();
  @Output() trash = new EventEmitter<DriveFolder>();
  @Output() fileDrop = new EventEmitter<string>(); // fileId

  isDragOver = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    // Only clear if leaving the card entirely (not entering a child)
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      this.isDragOver = false;
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const fileId = event.dataTransfer?.getData('application/homedrive-file');
    if (fileId) this.fileDrop.emit(fileId);
  }
}
