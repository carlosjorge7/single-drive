import { Injectable, NgZone, signal } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { enviroment } from '../../../enviroments';
import { DriveFile, DriveFileService } from './drive-file.service';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  folderId?: string | null;
  attempts: number;
}

const MAX_CONCURRENT = 2;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [2000, 5000, 10000];
const MAX_SIZE_BYTES = 20 * 1024 * 1024 * 1024; // 20 GB

const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.msi',
  '.dll', '.jar', '.apk', '.ipa', '.dmg', '.pkg',
]);

export interface ValidationError {
  name: string;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly api = enviroment.apiUrl;

  queue = signal<UploadItem[]>([]);
  panelVisible = signal(false);
  lastRejected = signal<ValidationError[]>([]);

  private active = 0;

  constructor(
    private http: HttpClient,
    private zone: NgZone,
    private fileService: DriveFileService,
  ) {}

  enqueue(files: File[], folderId?: string | null): ValidationError[] {
    const valid: UploadItem[] = [];
    const rejected: ValidationError[] = [];

    for (const file of files) {
      const ext = file.name.includes('.')
        ? '.' + file.name.split('.').pop()!.toLowerCase()
        : '';

      if (BLOCKED_EXTENSIONS.has(ext)) {
        rejected.push({ name: file.name, reason: `Tipo no permitido (${ext})` });
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        rejected.push({ name: file.name, reason: 'Archivo supera 20 GB' });
        continue;
      }
      valid.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        status: 'queued',
        progress: 0,
        folderId,
        attempts: 0,
      });
    }

    if (valid.length) {
      this.queue.update((q) => [...q, ...valid]);
      this.panelVisible.set(true);
      this.drain();
    }
    if (rejected.length) {
      this.lastRejected.set(rejected);
    }
    return rejected;
  }

  private drain() {
    const queued = this.queue().filter((i) => i.status === 'queued');
    const slots = MAX_CONCURRENT - this.active;
    queued.slice(0, slots).forEach((item) => this.startUpload(item));
  }

  private update(id: string, patch: Partial<UploadItem>) {
    this.zone.run(() => {
      this.queue.update((q) => q.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    });
  }

  private startUpload(item: UploadItem) {
    this.active++;
    this.update(item.id, { status: 'uploading', progress: 0, attempts: item.attempts + 1 });

    const fd = new FormData();
    fd.append('file', item.file, item.file.name);
    if (item.folderId) fd.append('folder_id', item.folderId);

    const req = new HttpRequest('POST', `${this.api}/upload/`, fd, {
      reportProgress: true,
    });

    this.http.request(req).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.update(item.id, { progress: Math.round((event.loaded / event.total) * 100) });
        } else if (event.type === HttpEventType.Response && event.status === 201) {
          const driveFile = event.body as DriveFile;
          this.update(item.id, { status: 'done', progress: 100 });
          this.fileService.addFile(driveFile);
          if (driveFile.file_type === 'image' || driveFile.file_type === 'video') {
            this.pollThumbnail(driveFile.id);
          }
        }
      },
      error: (err) => {
        this.active--;
        const currentItem = this.queue().find((i) => i.id === item.id);
        const attempts = currentItem?.attempts ?? item.attempts + 1;
        const isRetryable = err.status >= 500 || err.status === 0;

        if (isRetryable && attempts < MAX_RETRIES) {
          const delay = RETRY_BACKOFF_MS[attempts - 1] ?? 10000;
          this.update(item.id, { status: 'queued', progress: 0, attempts });
          this.zone.run(() => {
            setTimeout(() => this.drain(), delay);
          });
        } else {
          const msg = err?.error?.detail ?? `Error al subir (${err.status || 'sin conexión'})`;
          this.update(item.id, { status: 'error', error: msg });
          this.drain();
        }
      },
      complete: () => {
        this.active--;
        this.drain();
      },
    });
  }

  private pollThumbnail(fileId: string, attempts = 0) {
    if (attempts >= 12) return;
    this.zone.run(() => {
      setTimeout(() => {
        this.fileService.refreshFile(fileId).subscribe((f) => {
          if (f.processing_status === 'pending' || f.processing_status === 'processing') {
            this.pollThumbnail(fileId, attempts + 1);
          }
        });
      }, 3000);
    });
  }

  dismiss(id: string) {
    this.queue.update((q) => q.filter((i) => i.id !== id));
  }

  dismissDone() {
    this.queue.update((q) => q.filter((i) => i.status !== 'done'));
  }
}
