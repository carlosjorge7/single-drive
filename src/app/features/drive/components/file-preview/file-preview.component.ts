import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DriveFile } from '../../../../core/services/drive-file.service';
import { TokenService } from '../../../../core/auth/token.service';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { enviroment } from '../../../../../enviroments';

export type PreviewKind = 'loading' | 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'none';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, ProgressSpinnerModule, FileSizePipe],
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.scss',
})
export class FilePreviewComponent implements OnChanges, OnDestroy {
  @Input() file: DriveFile | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  kind: PreviewKind = 'none';

  // iframe [src] → SafeResourceUrl (PDF, Video fallback)
  pdfUrl: SafeResourceUrl | null = null;
  // <img [src]> → SafeUrl
  imageUrl: SafeUrl | null = null;
  // <video [src]>, <audio [src]> → SafeResourceUrl
  mediaUrl: SafeResourceUrl | null = null;
  // <pre> content
  textContent: string | null = null;

  private blobObjectUrl: string | null = null;
  private sub: Subscription | null = null;
  private readonly apiBase = enviroment.apiUrl;

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private token: TokenService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file'] || changes['visible']) {
      this.cleanup();
      if (this.visible && this.file) {
        this.prepare(this.file);
      }
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ─── URL helpers ───────────────────────────────────────────────────────────

  /** Always valid — built from local API base + file ID, no backend list needed. */
  private streamUrl(file: DriveFile): string {
    return `${this.apiBase}/files/${file.id}/stream/`;
  }

  /** For HTML elements that can't set headers (video, audio src). */
  private streamUrlWithToken(file: DriveFile): string {
    const t = this.token.getAccess() ?? '';
    return `${this.streamUrl(file)}?token=${encodeURIComponent(t)}`;
  }

  // ─── State machine ─────────────────────────────────────────────────────────

  private prepare(file: DriveFile): void {
    const mime = file.mime_type ?? '';

    // Video / Audio — browser manages buffering & range requests natively
    if (file.file_type === 'video' || file.file_type === 'audio') {
      this.kind = file.file_type as PreviewKind;
      this.mediaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.streamUrlWithToken(file),
      );
      return;
    }

    // PDF, Image, Text — fetch via HttpClient (auth interceptor adds Bearer token)
    this.kind = 'loading';

    if (mime === 'application/pdf') {
      this.sub = this.http
        .get(this.streamUrl(file), { responseType: 'blob' })
        .subscribe({
          next: (blob) => {
            this.blobObjectUrl = URL.createObjectURL(blob);
            // iframe requires SafeResourceUrl
            this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobObjectUrl);
            this.kind = 'pdf';
          },
          error: () => { this.kind = 'none'; },
        });
      return;
    }

    if (file.file_type === 'image') {
      this.sub = this.http
        .get(this.streamUrl(file), { responseType: 'blob' })
        .subscribe({
          next: (blob) => {
            this.blobObjectUrl = URL.createObjectURL(blob);
            // <img> requires SafeUrl
            this.imageUrl = this.sanitizer.bypassSecurityTrustUrl(this.blobObjectUrl);
            this.kind = 'image';
          },
          error: () => { this.kind = 'none'; },
        });
      return;
    }

    if (
      mime.startsWith('text/') ||
      mime === 'application/json' ||
      mime === 'application/xml'
    ) {
      this.sub = this.http
        .get(this.streamUrl(file), { responseType: 'text' })
        .subscribe({
          next: (text) => { this.textContent = text; this.kind = 'text'; },
          error: () => { this.kind = 'none'; },
        });
      return;
    }

    this.kind = 'none';
  }

  private cleanup(): void {
    this.sub?.unsubscribe();
    this.sub = null;
    if (this.blobObjectUrl) {
      URL.revokeObjectURL(this.blobObjectUrl);
      this.blobObjectUrl = null;
    }
    this.kind = 'none';
    this.pdfUrl = null;
    this.imageUrl = null;
    this.mediaUrl = null;
    this.textContent = null;
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  download(): void {
    if (!this.file) return;
    const a = document.createElement('a');
    a.href = this.streamUrlWithToken(this.file);
    a.download = this.file.original_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  close(): void {
    this.visibleChange.emit(false);
  }
}
