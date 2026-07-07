import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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
export class DriveComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(!this.isMobile());

  private routerSub?: Subscription;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.authService.currentUser()) {
      this.authService.loadCurrentUser().subscribe();
    }

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile()) {
          this.sidebarOpen.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  isMobile(): boolean {
    return window.innerWidth < 769;
  }
}
