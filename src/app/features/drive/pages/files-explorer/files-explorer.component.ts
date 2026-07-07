import { Component, OnInit, OnDestroy, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil, debounceTime } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';

import { DriveFileService, DriveFile } from '../../../../core/services/drive-file.service';
import { FolderService, DriveFolder } from '../../../../core/services/folder.service';
import { UploadService } from '../../../../core/services/upload.service';
import { SelectionService } from '../../../../core/services/selection.service';
import { BulkActionsBarComponent } from '../../components/bulk-actions-bar/bulk-actions-bar.component';
import { FileCardComponent } from '../../components/file-card/file-card.component';
import { FolderCardComponent } from '../../components/folder-card/folder-card.component';
import { FilePreviewComponent } from '../../components/file-preview/file-preview.component';
import { LightboxComponent } from '../../components/lightbox/lightbox.component';
import { DragDropOverlayComponent } from '../../components/drag-drop-overlay/drag-drop-overlay.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { FileTypeIconPipe } from '../../../../shared/pipes/file-type-icon.pipe';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';

type ViewMode = 'grid' | 'list';
type SortOption = '-created_at' | 'created_at' | 'name' | '-name' | '-size' | 'size';

@Component({
  selector: 'app-files-explorer',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, DropdownModule, SkeletonModule,
    ToastModule, ConfirmDialogModule, DialogModule,
    FileCardComponent, FolderCardComponent, FilePreviewComponent,
    LightboxComponent, DragDropOverlayComponent, BreadcrumbComponent,
    FileSizePipe, FileTypeIconPipe,
    EmptyStateComponent, ErrorStateComponent,
    BulkActionsBarComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './files-explorer.component.html',
  styleUrl: './files-explorer.component.scss',
})
export class FilesExplorerComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();
  private listSub: Subscription | null = null;
  viewMode = signal<ViewMode>('grid');
  searchQuery = '';
  sortValue: SortOption = '-created_at';
  currentFolder: string | null = null;
  fileType: string | null = null;
  isTrash = false;
  isShared = false;
  isFolderMode = false;
  pageTitle = 'Archivos';
  breadcrumb: BreadcrumbItem[] = [];
  isRecent = false;
  bulkMoveIds: string[] = [];

  previewFile: DriveFile | null = null;
  previewVisible = false;
  lightboxVisible = false;
  lightboxActiveId: string | null = null;

  // File rename
  renameDialogVisible = false;
  renameTarget: DriveFile | null = null;
  renameName = '';

  // Folder create/rename
  folderDialogVisible = false;
  folderDialogMode: 'create' | 'rename' = 'create';
  folderDialogName = '';
  folderRenameTarget: DriveFolder | null = null;

  // Move to folder dialog
  moveDialogVisible = false;
  moveTarget: DriveFile | null = null;
  moveFolders: DriveFolder[] = [];

  skeletonItems = Array(8);

  imageFiles = computed(() => this.fileService.files().filter(f => f.file_type === 'image'));

  sortOptions = [
    { label: 'Más reciente', value: '-created_at' },
    { label: 'Más antiguo', value: 'created_at' },
    { label: 'Nombre A-Z', value: 'name' },
    { label: 'Nombre Z-A', value: '-name' },
    { label: 'Mayor tamaño', value: '-size' },
    { label: 'Menor tamaño', value: 'size' },
  ];

  get showFolders(): boolean {
    return this.isFolderMode || (!this.isTrash && !this.isShared && !this.fileType && !this.isRecent);
  }

  constructor(
    public fileService: DriveFileService,
    public folderService: FolderService,
    public uploadService: UploadService,
    public selectionService: SelectionService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.applyRouteData();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$),
    ).subscribe(() => this.applyRouteData());

    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe((value) => {
      this.searchQuery = value;
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.listSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyRouteData(): void {
    // Use the live router state, not the possibly-stale injected ActivatedRoute snapshot,
    // so navigation between routes that share this component always reads fresh data.
    let snap = this.router.routerState.snapshot.root;
    while (snap.firstChild) snap = snap.firstChild;
    const data = snap.data;

    const type       = (data['type']       as string)  ?? null;
    const title      = (data['title']      as string)  ?? 'Archivos';
    const trash      = (data['trash']      as boolean) ?? false;
    const shared     = (data['shared']     as boolean) ?? false;
    const folderMode = (data['folderMode'] as boolean) ?? false;
    const folderId   = folderMode ? (snap.params['id'] as string ?? null) : null;
    const recent     = (data['recent']     as boolean) ?? false;

    const changed =
      type !== this.fileType ||
      title !== this.pageTitle ||
      trash !== this.isTrash ||
      shared !== this.isShared ||
      folderId !== this.currentFolder ||
      recent !== this.isRecent;

    if (changed) {
      this.fileType = type;
      this.pageTitle = folderMode ? '' : title;
      this.isTrash = trash;
      this.isShared = shared;
      this.isFolderMode = folderMode;
      this.currentFolder = folderId;
      this.isRecent = recent;
      this.selectionService.clear();
      this.fileService.clearFiles();
      this.fileService.clearCursor();
      this.folderService.clearFolders();

      if (folderMode && folderId) {
        this.loadFolder(folderId);
      } else {
        this.breadcrumb = [];
        this.load();
        if (this.showFolders) this.loadSubFolders();
      }
    }
  }

  private loadFolder(folderId: string) {
    this.folderService.get(folderId).subscribe({
      next: (folder) => {
        this.pageTitle = folder.name;
        this.breadcrumb = folder.path.slice(0, -1);
        this.load();
        this.loadSubFolders();
      },
      error: () => this.toast('error', 'No se pudo cargar la carpeta'),
    });
  }

  private loadSubFolders() {
    this.folderService.list(this.currentFolder).subscribe();
  }

  load(append = false) {
    this.listSub?.unsubscribe();
    if (this.isRecent) {
      this.listSub = this.fileService.listRecent({
        search: this.searchQuery || undefined,
        cursor: append ? (this.fileService.nextCursor() ?? undefined) : undefined,
      }).subscribe({
        error: () => this.toast('error', 'Error al cargar archivos recientes'),
      });
    } else {
      this.listSub = this.fileService.list({
        trash:    this.isTrash   || undefined,
        shared:   this.isShared  || undefined,
        folder:   (!this.isTrash && !this.isShared && !this.fileType) ? (this.currentFolder ?? 'root') : undefined,
        type:     this.fileType  ?? undefined,
        ordering: this.sortValue,
        search:   this.searchQuery || undefined,
        cursor:   append ? (this.fileService.nextCursor() ?? undefined) : undefined,
      }).subscribe({
        error: () => this.toast('error', 'Error al cargar los archivos'),
      });
    }
  }

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  onSortChange() {
    this.load();
  }

  openFileInput() {
    const input = this.el.nativeElement.querySelector('#file-input') as HTMLInputElement;
    input?.click();
  }

  onFilesSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (files.length) this.notifyRejected(this.uploadService.enqueue(files, this.currentFolder));
    (event.target as HTMLInputElement).value = '';
  }

  onFilesDropped(files: File[]) {
    this.notifyRejected(this.uploadService.enqueue(files, this.currentFolder));
  }

  private notifyRejected(rejected: { name: string; reason: string }[]) {
    rejected.forEach(r => this.toast('error', `${r.name}: ${r.reason}`));
  }

  onPreview(file: DriveFile) {
    if (file.file_type === 'image') {
      this.lightboxActiveId = file.id;
      this.lightboxVisible = true;
    } else {
      this.previewFile = file;
      this.previewVisible = true;
    }
  }

  onDownload(file: DriveFile) {
    const a = document.createElement('a');
    a.href = file.stream_url ?? '';
    a.download = file.original_name;
    a.click();
  }

  onTrash(file: DriveFile) {
    this.confirmationService.confirm({
      message: `¿Mover "${file.name}" a la papelera?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Mover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.fileService.trash(file.id).subscribe({
          next: () => this.toast('success', `"${file.name}" movido a la papelera`),
          error: () => this.toast('error', 'No se pudo eliminar el archivo'),
        });
      },
    });
  }

  onRestore(file: DriveFile) {
    this.fileService.restore(file.id).subscribe({
      next: () => this.toast('success', `"${file.name}" restaurado`),
      error: () => this.toast('error', 'No se pudo restaurar'),
    });
  }

  onDeletePermanent(file: DriveFile) {
    this.confirmationService.confirm({
      message: `¿Eliminar "${file.name}" definitivamente? Esta acción no se puede deshacer.`,
      header: 'Eliminar permanentemente',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.fileService.deletePermanent(file.id).subscribe({
          next: () => this.toast('success', `"${file.name}" eliminado permanentemente`),
          error: () => this.toast('error', 'No se pudo eliminar'),
        });
      },
    });
  }

  onEmptyTrash() {
    this.confirmationService.confirm({
      message: '¿Vaciar la papelera? Se eliminarán todos los archivos permanentemente.',
      header: 'Vaciar papelera',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Vaciar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.fileService.emptyTrash().subscribe({
          next: () => this.toast('success', 'Papelera vaciada'),
          error: () => this.toast('error', 'No se pudo vaciar la papelera'),
        });
      },
    });
  }

  // ---- File rename ----
  openRename(file: DriveFile) {
    this.renameTarget = file;
    this.renameName = file.name;
    this.renameDialogVisible = true;
  }

  confirmRename() {
    if (!this.renameTarget || !this.renameName.trim()) return;
    this.fileService.rename(this.renameTarget.id, this.renameName.trim()).subscribe({
      next: () => {
        this.toast('success', 'Archivo renombrado');
        this.renameDialogVisible = false;
      },
      error: () => this.toast('error', 'No se pudo renombrar'),
    });
  }

  // ---- Folder create/rename ----
  openNewFolder() {
    this.folderDialogMode = 'create';
    this.folderDialogName = '';
    this.folderRenameTarget = null;
    this.folderDialogVisible = true;
  }

  openFolderRename(folder: DriveFolder) {
    this.folderDialogMode = 'rename';
    this.folderDialogName = folder.name;
    this.folderRenameTarget = folder;
    this.folderDialogVisible = true;
  }

  confirmFolderDialog() {
    const name = this.folderDialogName.trim();
    if (!name) return;
    if (this.folderDialogMode === 'create') {
      this.folderService.create(name, this.currentFolder).subscribe({
        next: () => {
          this.toast('success', `Carpeta "${name}" creada`);
          this.folderDialogVisible = false;
        },
        error: () => this.toast('error', 'No se pudo crear la carpeta'),
      });
    } else if (this.folderRenameTarget) {
      this.folderService.rename(this.folderRenameTarget.id, name).subscribe({
        next: () => {
          this.toast('success', 'Carpeta renombrada');
          this.folderDialogVisible = false;
        },
        error: () => this.toast('error', 'No se pudo renombrar'),
      });
    }
  }

  onFolderTrash(folder: DriveFolder) {
    this.confirmationService.confirm({
      message: `¿Mover la carpeta "${folder.name}" y su contenido a la papelera?`,
      header: 'Eliminar carpeta',
      icon: 'pi pi-trash',
      acceptLabel: 'Mover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.folderService.trash(folder.id).subscribe({
          next: () => this.toast('success', `"${folder.name}" movida a la papelera`),
          error: () => this.toast('error', 'No se pudo eliminar la carpeta'),
        });
      },
    });
  }

  openFolder(folder: DriveFolder) {
    this.router.navigate(['/drive/folder', folder.id]);
  }

  onBreadcrumbNavigate(item: BreadcrumbItem) {
    if (item.id === null) {
      this.router.navigate(['/drive/files']);
    } else {
      this.router.navigate(['/drive/folder', item.id]);
    }
  }

  // ---- Move to folder ----
  openMove(file: DriveFile) {
    this.moveTarget = file;
    this.folderService.list(null).subscribe({
      next: (folders) => {
        this.moveFolders = folders;
        this.moveDialogVisible = true;
      },
    });
  }

  confirmMove(folderId: string | null) {
    if (this.bulkMoveIds.length) {
      this.fileService.bulkMove(this.bulkMoveIds, folderId).subscribe({
        next: () => {
          const ids = this.bulkMoveIds;
          ids.forEach((id) => this.fileService.removeFile(id));
          this.selectionService.clear();
          this.toast('success', `${ids.length} archivo(s) movido(s)`);
          this.moveDialogVisible = false;
          this.bulkMoveIds = [];
        },
        error: () => this.toast('error', 'No se pudieron mover los archivos'),
      });
    } else if (this.moveTarget) {
      this.folderService.moveFile(this.moveTarget.id, folderId).subscribe({
        next: () => {
          this.fileService.removeFile(this.moveTarget!.id);
          this.toast('success', 'Archivo movido');
          this.moveDialogVisible = false;
          this.moveTarget = null;
        },
        error: () => this.toast('error', 'No se pudo mover el archivo'),
      });
    }
  }

  onFileDropToFolder(folder: DriveFolder, fileId: string) {
    this.folderService.moveFile(fileId, folder.id).subscribe({
      next: () => {
        this.fileService.removeFile(fileId);
        this.toast('success', `Archivo movido a "${folder.name}"`);
      },
      error: () => this.toast('error', 'No se pudo mover el archivo'),
    });
  }

  onBulkTrash(ids: string[]) {
    this.confirmationService.confirm({
      message: `¿Mover ${ids.length} archivo(s) a la papelera?`,
      header: 'Eliminar selección',
      icon: 'pi pi-trash',
      acceptLabel: 'Mover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.fileService.bulkTrash(ids).subscribe({
          next: (res) => {
            this.selectionService.clear();
            this.toast('success', res.detail);
          },
          error: () => this.toast('error', 'No se pudieron eliminar los archivos'),
        });
      },
    });
  }

  onBulkMove(ids: string[]) {
    this.bulkMoveIds = ids;
    this.moveTarget = null;
    this.folderService.list(null).subscribe({
      next: (folders) => {
        this.moveFolders = folders;
        this.moveDialogVisible = true;
      },
    });
  }

  onBulkDownload(ids: string[]) {
    this.fileService.bulkDownload(ids).subscribe({
      error: () => this.toast('error', 'Error al descargar. Comprueba el tamaño de la selección.'),
    });
  }

  // ---- Infinite scroll ----
  loadMore() {
    if (this.fileService.nextCursor() && !this.fileService.loading()) {
      this.load(true);
    }
  }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event) {
    const el = e.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      this.loadMore();
    }
  }

  private toast(severity: 'success' | 'error', summary: string) {
    this.messageService.add({ severity, summary, life: 3000 });
  }
}
