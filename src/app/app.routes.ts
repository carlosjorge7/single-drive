import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'private',
    loadChildren: () =>
      import('./private/private.routes').then((m) => m.routes),
  },
  {
    path: 'public',
    loadChildren: () => import('./public/public.routes').then((m) => m.routes),
  },
  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full',
  },
];
