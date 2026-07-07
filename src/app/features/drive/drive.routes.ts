import { Routes } from '@angular/router';

export const driveRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'files',
    loadComponent: () =>
      import('./pages/files-explorer/files-explorer.component').then(m => m.FilesExplorerComponent),
    data: { title: 'Todos los archivos' },
  },
  {
    path: 'photos',
    loadComponent: () =>
      import('./pages/files-explorer/files-explorer.component').then(m => m.FilesExplorerComponent),
    data: { type: 'image', title: 'Fotos' },
  },
  {
    path: 'media',
    loadComponent: () =>
      import('./pages/files-explorer/files-explorer.component').then(m => m.FilesExplorerComponent),
    data: { type: 'video,audio', title: 'Audio y Vídeo' },
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./pages/files-explorer/files-explorer.component').then(m => m.FilesExplorerComponent),
    data: { type: 'document', title: 'Documentos' },
  },
  {
    path: 'shared',
    loadComponent: () =>
      import('./pages/files-explorer/files-explorer.component').then(m => m.FilesExplorerComponent),
    data: { shared: true, title: 'Compartido' },
  },
  {
    path: 'trash',
    loadComponent: () =>
      import('./pages/files-explorer/files-explorer.component').then(m => m.FilesExplorerComponent),
    data: { trash: true, title: 'Papelera' },
  },
  {
    path: 'recent',
    loadComponent: () =>
      import('./pages/files-explorer/files-explorer.component').then(m => m.FilesExplorerComponent),
    data: { title: 'Recientes', recent: true },
  },
  {
    path: 'folder/:id',
    loadComponent: () =>
      import('./pages/files-explorer/files-explorer.component').then(m => m.FilesExplorerComponent),
    data: { folderMode: true },
  },
];
