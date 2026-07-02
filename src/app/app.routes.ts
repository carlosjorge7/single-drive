import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'drive',
    loadComponent: () =>
      import('./features/drive/drive.component').then((m) => m.DriveComponent),
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/drive/drive.routes').then((m) => m.driveRoutes),
  },
  {
    path: '',
    redirectTo: 'drive',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'drive',
  },
];
