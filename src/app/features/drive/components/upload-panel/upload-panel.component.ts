import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { UploadService, UploadItem } from '../../../../core/services/upload.service';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-upload-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressBarModule, TooltipModule, FileSizePipe],
  templateUrl: './upload-panel.component.html',
  styleUrl: './upload-panel.component.scss',
})
export class UploadPanelComponent {
  collapsed = false;

  activeCount = computed(
    () => this.uploadService.queue().filter((i) => i.status === 'uploading' || i.status === 'queued' ).length,
  );

  hasDone = computed(() => this.uploadService.queue().some((i) => i.status === 'done'));

  constructor(public uploadService: UploadService) {}

  statusIcon(item: UploadItem): string {
    const map: Record<string, string> = {
      queued:     'pi-clock',
      uploading:  'pi-spin pi-spinner',
      processing: 'pi-spin pi-spinner',
      done:       'pi-check-circle',
      error:      'pi-times-circle',
    };
    return map[item.status] ?? 'pi-file';
  }

  statusColor(item: UploadItem): string {
    const map: Record<string, string> = {
      queued:     'var(--hd-text-muted)',
      uploading:  'var(--hd-primary)',
      processing: '#f59e0b',
      done:       '#22c55e',
      error:      '#ef4444',
    };
    return map[item.status] ?? 'var(--hd-text-muted)';
  }
}
