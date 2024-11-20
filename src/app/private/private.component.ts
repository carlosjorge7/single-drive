import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SplitterModule } from 'primeng/splitter';
import { FotosComponent } from './fotos/fotos.component';
import { VideosComponent } from './videos/videos.component';
import { RecetasComponent } from './recetas/recetas.component';
import { PelisComponent } from './pelis/pelis.component';
import { PlanesComponent } from './planes/planes.component';
import { ArchivosComponent } from './archivos/archivos.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-private',
  standalone: true,
  imports: [
    SplitterModule,
    ButtonModule,
    RouterLink,
    FotosComponent,
    VideosComponent,
    RecetasComponent,
    PelisComponent,
    PlanesComponent,
    ArchivosComponent,
    NgClass,
  ],
  templateUrl: './private.component.html',
  styleUrl: './private.component.scss',
})
export class PrivateComponent {
  selectedPath = signal<string>('archivos');
  private readonly router = inject(Router);

  public isActive(path: string): boolean {
    return this.selectedPath() === path;
  }

  public renderComponent(path: string): void {
    this.selectedPath.set(path);
    console.log(this.selectedPath());
    this.router.navigate(['/private/' + path]);
  }
}
