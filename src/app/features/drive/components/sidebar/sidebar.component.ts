import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FolderService, DriveFolder } from '../../../../core/services/folder.service';
import { DriveFileService, StatsResponse } from '../../../../core/services/drive-file.service';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-drive-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonModule, FileSizePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class DriveSidebarComponent implements OnInit {
  @Input() open = true;
  @Output() toggle = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Mi Drive', icon: 'pi-home', route: '/drive/dashboard' },
    { label: 'Recientes', icon: 'pi-clock', route: '/drive/recent' },
    { label: 'Todos los archivos', icon: 'pi-folder-open', route: '/drive/files' },
    { label: 'Fotos', icon: 'pi-images', route: '/drive/photos' },
    { label: 'Audio y Vídeo', icon: 'pi-video', route: '/drive/media' },
    { label: 'Documentos', icon: 'pi-file', route: '/drive/documents' },
    { label: 'Compartido', icon: 'pi-users', route: '/drive/shared' },
    { label: 'Papelera', icon: 'pi-trash', route: '/drive/trash' },
  ];

  expandedFolders = signal<Set<string>>(new Set());

  stats = signal<StatsResponse | null>(null);
  usagePercent = computed(() => {
    const s = this.stats();
    if (!s || !s.quota_bytes) return 0;
    return Math.min(100, Math.round((s.total_size / s.quota_bytes) * 100));
  });

  constructor(
    public folderService: FolderService,
    private router: Router,
    private fileService: DriveFileService,
  ) {}

  ngOnInit() {
    this.folderService.loadTree().subscribe();
    this.fileService.loadStats().subscribe({
      next: (s) => this.stats.set(s),
    });
  }

  toggleFolder(id: string) {
    this.expandedFolders.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  openFolder(folder: DriveFolder) {
    this.router.navigate(['/drive/folder', folder.id]);
  }

  isExpanded(id: string) {
    return this.expandedFolders().has(id);
  }

  isCurrentFolder(id: string): boolean {
    return this.router.url === `/drive/folder/${id}`;
  }
}
