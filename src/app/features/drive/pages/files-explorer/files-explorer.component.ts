import { Component, OnInit, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';

import { DriveFileService, DriveFile } from '../../../../core/services/drive-file.service';
import { UploadService } from '../../../../core/services/upload.service';
import { FileCardComponent } from '../../components/file-card/file-card.component';
import { FilePreviewComponent } from '../../components/file-preview/file-preview.component';
import { LightboxComponent } from '../../components/lightbox/lightbox.component';
import { DragDropOverlayComponent } from '../../components/drag-drop-overlay/drag-drop-overlay.component';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { FileTypeIconPipe } from '../../../../shared/pipes/file-type-icon.pipe';

type ViewMode = 'grid' | 'list';
type SortOption = '-created_at' | 'created_at' | 'name' | '-name' | '-size' | 'size';


@Component({
  selector: 'app-files-explorer',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, DropdownModule, SkeletonModule,
    ToastModule, ConfirmDialogModule, DialogModule,
    FileCardComponent, FilePreviewComponent, LightboxComponent,
    DragDropOverlayComponent, FileSizePipe, FileTypeIconPipe,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './files-explorer.component.html',
  styleUrl: './files-explorer.component.scss',
})
export class FilesExplorerComponent implements OnInit {
  viewMode = signal<ViewMode>('grid');
  searchQuery = '';
  sortValue: SortOption = '-created_at';
  currentFolder: string | null = null;
  fileType: string | null = null;
  isTrash = false;
  isShared = false;
  pageTitle = 'Archivos';

  // Preview (non-image files)
  previewFile: DriveFile | null = null;
  previewVisible = false;

  // Lightbox (images)
  lightboxVisible = false;
  lightboxActiveId: string | null = null;

  renameDialogVisible = false;
  renameTarget: DriveFile | null = null;
  renameName = '';

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

  constructor(
    public fileService: DriveFileService,
    public uploadService: UploadService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.applyRouteData();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.applyRouteData();
    });
  }

  private applyRouteData(): void {
    let leaf = this.route;
    while (leaf.firstChild) leaf = leaf.firstChild;
    const data = leaf.snapshot.data;
    const type   = (data['type']   as string)  ?? null;
    const title  = (data['title']  as string)  ?? 'Archivos';
    const trash  = (data['trash']  as boolean) ?? false;
    const shared = (data['shared'] as boolean) ?? false;
    if (type !== this.fileType || title !== this.pageTitle || trash !== this.isTrash || shared !== this.isShared) {
      this.fileType = type;
      this.pageTitle = title;
      this.isTrash = trash;
      this.isShared = shared;
      this.fileService.files.set([]);
      this.fileService.nextCursor.set(null);
      this.load();
    }
  }

  load(append = false) {
    this.fileService.list({
      trash:  this.isTrash  || undefined,
      shared: this.isShared || undefined,
      folder: (!this.isTrash && !this.isShared && !this.fileType) ? (this.currentFolder ?? 'root') : undefined,
      type:   this.fileType ?? undefined,
      ordering: this.sortValue,
      search: this.searchQuery || undefined,
      cursor: append ? (this.fileService.nextCursor() ?? undefined) : undefined,
    }).subscribe({
      error: () => this.toast('error', 'Error al cargar los archivos'),
    });
  }

  onSearch(value: string) {
    this.searchQuery = value;
    this.load();
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
