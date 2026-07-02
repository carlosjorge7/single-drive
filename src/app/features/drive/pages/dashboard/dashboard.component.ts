import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DriveFileService, DriveFile } from '../../../../core/services/drive-file.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { FileTypeIconPipe } from '../../../../shared/pipes/file-type-icon.pipe';

interface DriveStats {
  total_files: number;
  total_size: number;
  by_type: Record<string, number>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, FileSizePipe, FileTypeIconPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  stats = signal<DriveStats | null>(null);
  recentFiles = signal<DriveFile[]>([]);
  loading = signal(true);

  constructor(
    public authService: AuthService,
    private fileService: DriveFileService,
  ) {}

  ngOnInit(): void {
    this.fileService.stats().subscribe({ next: s => this.stats.set(s) });
    this.fileService.list({ ordering: '-created_at' }).subscribe({
      next: () => {
        this.recentFiles.set(this.fileService.files().slice(0, 8));
        this.loading.set(false);
      },
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get username(): string {
    return this.authService.currentUser()?.username ?? 'Usuario';
  }

  get storagePercent(): number {
    const s = this.stats();
    if (!s || s.total_size === 0) return 0;
    const MAX = 10 * 1024 * 1024 * 1024;
    return Math.min(Math.round((s.total_size / MAX) * 100), 100);
  }
}
