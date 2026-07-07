import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { enviroment } from '../../../enviroments';

export interface DriveFolder {
  id: string;
  name: string;
  parent: string | null;
  is_shared: boolean;
  children_count: number;
  files_count: number;
  path: { id: string; name: string }[];
  children?: DriveFolder[];
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class FolderService {
  private readonly api = enviroment.apiUrl;

  private readonly _folders = signal<DriveFolder[]>([]);
  private readonly _tree = signal<DriveFolder[]>([]);

  readonly folders = this._folders.asReadonly();
  readonly tree = this._tree.asReadonly();

  clearFolders() { this._folders.set([]); }

  constructor(private http: HttpClient) {}

  list(parentId?: string | null) {
    let p = new HttpParams();
    if (parentId === null || parentId === undefined) {
      p = p.set('parent', 'root');
    } else {
      p = p.set('parent', parentId);
    }
    return this.http.get<DriveFolder[]>(`${this.api}/folders/`, { params: p }).pipe(
      tap((res) => this._folders.set(res)),
    );
  }

  loadTree() {
    return this.http.get<DriveFolder[]>(`${this.api}/folders/tree/`).pipe(
      tap((res) => this._tree.set(res)),
    );
  }

  get(id: string) {
    return this.http.get<DriveFolder>(`${this.api}/folders/${id}/`);
  }

  create(name: string, parentId?: string | null) {
    const body: Record<string, unknown> = { name };
    if (parentId) body['parent'] = parentId;
    return this.http.post<DriveFolder>(`${this.api}/folders/`, body).pipe(
      tap((folder) => {
        this._folders.update((f) => [folder, ...f]);
        this._tree.update((t) => {
          if (!parentId) return [folder, ...t];
          return t.map((root) => this._addChild(root, parentId, folder));
        });
      }),
    );
  }

  rename(id: string, name: string) {
    return this.http.patch<DriveFolder>(`${this.api}/folders/${id}/`, { name }).pipe(
      tap((updated) => {
        this._folders.update((f) => f.map((x) => (x.id === id ? { ...x, ...updated } : x)));
        this._tree.update((t) => this._updateName(t, id, name));
      }),
    );
  }

  trash(id: string) {
    return this.http.post(`${this.api}/folders/${id}/trash/`, {}).pipe(
      tap(() => {
        this._folders.update((f) => f.filter((x) => x.id !== id));
        this._tree.update((t) => this._removeNode(t, id));
      }),
    );
  }

  moveFile(fileId: string, folderId: string | null) {
    return this.http.post(`${this.api}/files/${fileId}/move/`, { folder_id: folderId });
  }

  private _addChild(node: DriveFolder, parentId: string, child: DriveFolder): DriveFolder {
    if (node.id === parentId) {
      return { ...node, children: [child, ...(node.children ?? [])] };
    }
    if (node.children?.length) {
      return { ...node, children: node.children.map((c) => this._addChild(c, parentId, child)) };
    }
    return node;
  }

  private _updateName(nodes: DriveFolder[], id: string, name: string): DriveFolder[] {
    return nodes.map((n) => {
      if (n.id === id) return { ...n, name };
      if (n.children?.length) return { ...n, children: this._updateName(n.children, id, name) };
      return n;
    });
  }

  private _removeNode(nodes: DriveFolder[], id: string): DriveFolder[] {
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => (n.children?.length ? { ...n, children: this._removeNode(n.children, id) } : n));
  }
}
