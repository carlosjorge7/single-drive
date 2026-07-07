import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { enviroment } from '../../../enviroments';

export interface ExifData {
  date_taken?: string;
  camera_make?: string;
  camera_model?: string;
  gps?: { lat: number; lon: number };
}

export interface DriveFile {
  id: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | 'other';
  thumbnail_small_url: string | null;
  thumbnail_medium_url: string | null;
  stream_url: string | null;
  processing_status: 'pending' | 'processing' | 'done' | 'error';
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  folder: string | null;
  exif_data?: ExifData | null;
}

export interface PagedResponse<T> {
  count: number | null;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface StatsResponse {
  total_files: number;
  total_size: number;
  quota_bytes: number;
  by_type: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class DriveFileService {
  private readonly api = enviroment.apiUrl;

  private readonly _files = signal<DriveFile[]>([]);
  private readonly _loading = signal(false);
  private readonly _nextCursor = signal<string | null>(null);
  private readonly _loadError = signal(false);
  private readonly _stats = signal<StatsResponse | null>(null);

  readonly files = this._files.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly nextCursor = this._nextCursor.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  readonly stats = this._stats.asReadonly();

  clearFiles() { this._files.set([]); }
  clearCursor() { this._nextCursor.set(null); }
  removeFile(id: string) { this._files.update(files => files.filter(f => f.id !== id)); }

  constructor(private http: HttpClient) {}

  list(params: {
    folder?: string | null;
    type?: string;
    trash?: boolean;
    shared?: boolean;
    search?: string;
    ordering?: string;
    cursor?: string;
  } = {}) {
    this._loading.set(true);
    this._loadError.set(false);
    let p = new HttpParams();
    if (params.trash) { p = p.set('trash', 'true'); }
    else if (params.shared) { p = p.set('shared', 'true'); }
    else if (params.folder != null) { p = p.set('folder', params.folder); }
    if (params.type) p = p.set('type', params.type);
    if (params.search) p = p.set('search', params.search);
    if (params.ordering) p = p.set('ordering', params.ordering);
    if (params.cursor) p = p.set('cursor', params.cursor);

    return this.http.get<PagedResponse<DriveFile>>(`${this.api}/files/`, { params: p }).pipe(
      tap((res) => {
        this._files.set(params.cursor ? [...this._files(), ...res.results] : res.results);
        this._nextCursor.set(res.next ? new URL(res.next).searchParams.get('cursor') : null);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        this._loadError.set(true);
        return throwError(() => err);
      }),
    );
  }

  restore(id: string) {
    return this.http.post(`${this.api}/files/${id}/restore/`, {}).pipe(
      tap(() => this._files.update((files) => files.filter((f) => f.id !== id))),
    );
  }

  trash(id: string) {
    return this.http.post(`${this.api}/files/${id}/trash/`, {}).pipe(
      tap(() => this._files.update((files) => files.filter((f) => f.id !== id))),
    );
  }

  rename(id: string, name: string) {
    return this.http.patch<DriveFile>(`${this.api}/files/${id}/`, { name }).pipe(
      tap((updated) =>
        this._files.update((files) => files.map((f) => (f.id === id ? { ...f, ...updated } : f))),
      ),
    );
  }

  deletePermanent(id: string) {
    return this.http.delete(`${this.api}/files/${id}/delete_permanent/`).pipe(
      tap(() => this._files.update(files => files.filter(f => f.id !== id))),
    );
  }

  emptyTrash() {
    return this.http.delete(`${this.api}/files/empty_trash/`).pipe(
      tap(() => this._files.set([])),
    );
  }

  addFile(file: DriveFile) {
    this._files.update((files) => [file, ...files]);
  }

  refreshFile(id: string) {
    return this.http
      .get<DriveFile>(`${this.api}/files/${id}/`)
      .pipe(
        tap((updated) =>
          this._files.update((files) =>
            files.map((f) => (f.id === id ? { ...f, ...updated } : f)),
          ),
        ),
      );
  }

  bulkTrash(ids: string[]) {
    return this.http.post<{ detail: string; count: number }>(
      `${this.api}/files/bulk_trash/`,
      { ids },
    ).pipe(
      tap(() => {
        const idSet = new Set(ids);
        this._files.update((files) => files.filter((f) => !idSet.has(f.id)));
      }),
    );
  }

  bulkMove(ids: string[], folderId: string | null) {
    return this.http.post<{ detail: string; count: number }>(
      `${this.api}/files/bulk_move/`,
      { ids, folder_id: folderId },
    );
  }

  bulkDownload(ids: string[]) {
    const idsParam = ids.join(',');
    return this.http
      .get(`${this.api}/files/bulk_download/`, {
        params: { ids: idsParam },
        responseType: 'blob',
      })
      .pipe(
        tap((blob) => {
          const url = URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'homedrive-download.zip';
          a.click();
          URL.revokeObjectURL(url);
        }),
      );
  }

  listRecent(params: { search?: string; cursor?: string } = {}) {
    this._loading.set(true);
    this._loadError.set(false);
    let p = new HttpParams();
    if (params.search) p = p.set('search', params.search);
    if (params.cursor) p = p.set('cursor', params.cursor);
    return this.http
      .get<PagedResponse<DriveFile>>(`${this.api}/files/recent/`, { params: p })
      .pipe(
        tap((res) => {
          this._files.set(
            params.cursor ? [...this._files(), ...res.results] : res.results,
          );
          this._nextCursor.set(
            res.next ? new URL(res.next).searchParams.get('cursor') : null,
          );
          this._loading.set(false);
        }),
        catchError((err) => {
          this._loading.set(false);
          this._loadError.set(true);
          return throwError(() => err);
        }),
      );
  }

  loadStats() {
    return this.http.get<StatsResponse>(`${this.api}/files/stats/`).pipe(
      tap((res) => this._stats.set(res)),
    );
  }
}
