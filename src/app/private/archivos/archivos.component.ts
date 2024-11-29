import { Component, inject, OnInit } from '@angular/core';
import { Archivo } from './models/Archivo';
import { ArchivoService } from './services/archivo.service';
import { first } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { FormArchivoComponent } from './form-archivo/form-archivo.component';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-archivos',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    DialogModule,
    CardModule,
    FormArchivoComponent,
    CommonModule,
  ],
  templateUrl: './archivos.component.html',
  styleUrls: ['./archivos.component.scss'],
})
export class ArchivosComponent implements OnInit {
  archivos: Archivo[] = [];
  errorMessage: string | null = null;
  displayCreateDialog = false;

  private readonly archivoSvr = inject(ArchivoService);

  ngOnInit(): void {
    this.getArchivos();
  }

  private getArchivos(): void {
    this.archivoSvr
      .getAll()
      .pipe(first())
      .subscribe({
        next: (items) => {
          this.archivos = items;
        },
        error: (error) => {
          this.errorMessage = 'Error fetching media items';
          console.error(error);
        },
      });
  }

  public viewFile(archivo: Archivo): void {
    window.open(archivo.file as string, '_blank');
  }

  public deleteFile(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      this.archivoSvr.delete(id).subscribe({
        next: () => {
          this.archivos = this.archivos.filter((archivo) => archivo.id !== id);
          alert('Archivo eliminado con éxito');
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Error eliminando el archivo';
        },
      });
    }
  }

  public handleArchivoCreated(archivo: FormData): void {
    this.archivoSvr.create(archivo).subscribe({
      next: (archivo) => {
        this.archivos.push(archivo);
        this.displayCreateDialog = false;
      },
      error: (error) => {
        this.errorMessage = 'Error creando el archivo';
        console.error(error);
      },
    });
  }

  public openCreateDialog(): void {
    this.displayCreateDialog = true;
  }
}
