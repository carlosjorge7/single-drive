import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { User } from '../../../../core/auth/models/user.model';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-drive-toolbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputTextModule, AvatarModule, TooltipModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class DriveToolbarComponent {
  @Input() user: User | null = null;
  @Output() logout = new EventEmitter<void>();
  @Output() menuToggle = new EventEmitter<void>();

  readonly themeService = inject(ThemeService);

  get userInitials(): string {
    if (!this.user) return '?';
    if (this.user.first_name && this.user.last_name) {
      return `${this.user.first_name[0]}${this.user.last_name[0]}`.toUpperCase();
    }
    return this.user.username[0].toUpperCase();
  }
}
