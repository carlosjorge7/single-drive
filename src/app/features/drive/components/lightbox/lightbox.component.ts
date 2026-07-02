import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DriveFile, ExifData } from '../../../../core/services/drive-file.service';
import { TokenService } from '../../../../core/auth/token.service';
import { enviroment } from '../../../../../enviroments';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  styleUrl: './lightbox.component.scss',
  template: `
    @if (visible && activeFile) {
      <div class="lb-overlay" (click)="close()">
        <div class="lb-content" (click)="$event.stopPropagation()">

          <!-- Header bar -->
          <div class="lb-header">
            <span class="lb-filename">{{ activeFile.name }}</span>
            <button
              pButton type="button"
              icon="pi pi-times"
              class="p-button-text p-button-rounded lb-close"
              pTooltip="Cerrar (Esc)"
              (click)="close()"
            ></button>
          </div>

          <!-- Image -->
          <div class="lb-image-wrap">
            <img
              [src]="imageUrl"
              [alt]="activeFile.name"
              class="lb-image"
            />
          </div>

          <!-- Prev button -->
          @if (hasPrev) {
            <button class="lb-nav lb-prev" (click)="prev()" pTooltip="Anterior" tooltipPosition="right">
              <i class="pi pi-chevron-left"></i>
            </button>
          }

          <!-- Next button -->
          @if (hasNext) {
            <button class="lb-nav lb-next" (click)="next()" pTooltip="Siguiente" tooltipPosition="left">
              <i class="pi pi-chevron-right"></i>
            </button>
          }

          <!-- EXIF bar -->
          @if (activeFile.exif_data) {
            <div class="lb-exif">
              @if (activeFile.exif_data.date_taken) {
                <span class="exif-item">
                  <i class="pi pi-calendar"></i>
                  {{ activeFile.exif_data.date_taken | date:'dd/MM/yyyy HH:mm' }}
                </span>
              }
              @if (activeFile.exif_data.camera_make || activeFile.exif_data.camera_model) {
                <span class="exif-item">
                  <i class="pi pi-camera"></i>
                  {{ cameraName(activeFile.exif_data) }}
                </span>
              }
              @if (activeFile.exif_data.gps) {
                <a
                  class="exif-item exif-gps"
                  [href]="mapsUrl(activeFile.exif_data.gps.lat, activeFile.exif_data.gps.lon)"
                  target="_blank"
                  rel="noopener"
                >
                  <i class="pi pi-map-marker"></i>
                  Ver en Google Maps
                </a>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class LightboxComponent {
  @Input() files: DriveFile[] = [];
  @Input() activeId: string | null = null;
  @Input() visible = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() activeIdChange = new EventEmitter<string>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly tokenService = inject(TokenService);
  private readonly apiBase = enviroment.apiUrl;

  get activeIndex(): number {
    return this.files.findIndex(f => f.id === this.activeId);
  }

  get activeFile(): DriveFile | null {
    const idx = this.activeIndex;
    return idx >= 0 ? this.files[idx] : null;
  }

  get hasPrev(): boolean {
    return this.activeIndex > 0;
  }

  get hasNext(): boolean {
    return this.activeIndex < this.files.length - 1;
  }

  get imageUrl(): SafeUrl | null {
    const file = this.activeFile;
    if (!file) return null;
    const token = this.tokenService.getAccess() ?? '';
    const url = `${this.apiBase}/files/${file.id}/stream/?token=${encodeURIComponent(token)}`;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  prev(): void {
    const idx = this.activeIndex;
    if (idx > 0) {
      this.activeIdChange.emit(this.files[idx - 1].id);
    }
  }

  next(): void {
    const idx = this.activeIndex;
    if (idx < this.files.length - 1) {
      this.activeIdChange.emit(this.files[idx + 1].id);
    }
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  mapsUrl(lat: number, lon: number): string {
    return `https://www.google.com/maps?q=${lat},${lon}`;
  }

  cameraName(exif: ExifData): string {
    const parts: string[] = [];
    if (exif.camera_make) parts.push(exif.camera_make);
    if (exif.camera_model) parts.push(exif.camera_model);
    return parts.join(' ');
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.visible) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
    else if (e.key === 'Escape') this.close();
  }
}
