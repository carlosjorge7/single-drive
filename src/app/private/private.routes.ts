import { Routes } from '@angular/router';
import { PrivateComponent } from '../private/private.component';

export const routes: Routes = [
  {
    path: '',
    component: PrivateComponent,
    children: [
      {
        path: 'archivos',
        loadChildren: () =>
          import('./archivos/archivos.routes').then((m) => m.routes),
      },
      {
        path: 'fotos',
        loadChildren: () =>
          import('./fotos/fotos.routes').then((m) => m.routes),
      },
      {
        path: 'pelis',
        loadChildren: () =>
          import('./pelis/pelis.routes').then((m) => m.routes),
      },
      {
        path: 'planes',
        loadChildren: () =>
          import('./planes/planes.routes').then((m) => m.routes),
      },
      {
        path: 'recetas',
        loadChildren: () =>
          import('./recetas/recetas.routes').then((m) => m.routes),
      },
      {
        path: 'videos',
        loadChildren: () =>
          import('./videos/videos.routes').then((m) => m.routes),
      },
      {
        path: '',
        redirectTo: 'archivos',
        pathMatch: 'full',
      },
    ],
  },
];
