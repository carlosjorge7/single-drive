import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DriveSidebarComponent } from './components/sidebar/sidebar.component';
import { DriveToolbarComponent } from './components/toolbar/toolbar.component';
import { UploadPanelComponent } from './components/upload-panel/upload-panel.component';

@Component({
  selector: 'app-drive',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DriveSidebarComponent,
    DriveToolbarComponent,
    UploadPanelComponent,
  ],
  templateUrl: './drive.component.html',
  styleUrl: './drive.component.scss',
})
export class DriveComponent implements OnInit {
  sidebarOpen = signal(true);

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    if (!this.authService.currentUser()) {
      this.authService.loadCurrentUser().subscribe();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }
}
