import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-drive-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class DriveSidebarComponent {
  @Input() open = true;
  @Output() toggle = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Mi Drive', icon: 'pi-home', route: '/drive/dashboard' },
    { label: 'Todos los archivos', icon: 'pi-folder-open', route: '/drive/files' },
    { label: 'Fotos', icon: 'pi-images', route: '/drive/photos' },
    { label: 'Audio y Vídeo', icon: 'pi-video', route: '/drive/media' },
    { label: 'Documentos', icon: 'pi-file', route: '/drive/documents' },
    { label: 'Compartido', icon: 'pi-users', route: '/drive/shared' },
    { label: 'Papelera', icon: 'pi-trash', route: '/drive/trash' },
  ];
}
