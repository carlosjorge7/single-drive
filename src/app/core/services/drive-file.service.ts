import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { enviroment } from '../../../enviroments';

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
}

export interface PagedResponse<T> {
  count: number | null;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class DriveFileService {
  private readonly api = enviroment.apiUrl;

  files = signal<DriveFile[]>([]);
  loading = signal(false);
  nextCursor = signal<string | null>(null);

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
    this.loading.set(true);
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
        this.files.set(params.cursor ? [...this.files(), ...res.results] : res.results);
        this.nextCursor.set(res.next ? new URL(res.next).searchParams.get('cursor') : null);
        this.loading.set(false);
      }),
    );
  }

  trash(id: string) {
    return this.http.post(`${this.api}/files/${id}/trash/`, {}).pipe(
      tap(() => this.files.update((files) => files.filter((f) => f.id !== id))),
    );
  }

  rename(id: string, name: string) {
    return this.http.patch<DriveFile>(`${this.api}/files/${id}/`, { name }).pipe(
      tap((updated) =>
        this.files.update((files) => files.map((f) => (f.id === id ? { ...f, ...updated } : f))),
      ),
    );
  }

  stats() {
    return this.http.get<{
      total_files: number;
      total_size: number;
      by_type: Record<string, number>;
    }>(`${this.api}/files/stats/`);
  }

  addFile(file: DriveFile) {
    this.files.update((files) => [file, ...files]);
  }

  refreshFile(id: string) {
    return this.http
      .get<DriveFile>(`${this.api}/files/${id}/`)
      .pipe(
        tap((updated) =>
          this.files.update((files) =>
            files.map((f) => (f.id === id ? { ...f, ...updated } : f)),
          ),
        ),
      );
  }
}
