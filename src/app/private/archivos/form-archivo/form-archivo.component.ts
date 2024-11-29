import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { Archivo } from '../models/Archivo';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-form-archivo',
  standalone: true,
  imports: [CardModule, ButtonModule, ReactiveFormsModule],
  templateUrl: './form-archivo.component.html',
  styleUrl: './form-archivo.component.scss',
})
export class FormArchivoComponent {
  @Output() onEmitFile = new EventEmitter<FormData>();
  archivoForm: FormGroup;
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder) {
    this.archivoForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      file: [null, Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    console.log(event);
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      console.log(this.selectedFile);
      this.archivoForm.patchValue({ file: this.selectedFile });
    }
  }

  onSubmit(): void {
    if (this.archivoForm.valid && this.selectedFile) {
      // Crear un objeto FormData para manejar archivos
      const formData = new FormData();
      formData.append('name', this.archivoForm.get('name')?.value);
      formData.append(
        'description',
        this.archivoForm.get('description')?.value
      );
      formData.append('file', this.selectedFile);

      // Emitir el FormData
      this.onEmitFile.emit(formData);

      // Resetear formulario y archivo seleccionado
      this.archivoForm.reset();
      this.selectedFile = null;
    }
  }
}
