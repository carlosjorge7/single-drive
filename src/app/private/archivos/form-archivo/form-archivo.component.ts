import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-form-archivo',
  standalone: true,
  imports: [ButtonModule, ReactiveFormsModule],
  templateUrl: './form-archivo.component.html',
  styleUrl: './form-archivo.component.scss',
})
export class FormArchivoComponent {
  @Output() onEmitFile = new EventEmitter<FormData>();
  archivoForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  private initForm(): void {
    this.archivoForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      file: [null, Validators.required],
    });
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      console.log(this.selectedFile);
      this.archivoForm.patchValue({ file: this.selectedFile });
    }
  }

  public onSubmit(): void {
    if (this.archivoForm.valid && this.selectedFile) {
      const formData = new FormData();
      formData.append('name', this.archivoForm.get('name')?.value);
      formData.append(
        'description',
        this.archivoForm.get('description')?.value
      );
      formData.append('file', this.selectedFile);
      this.onEmitFile.emit(formData);
      this.archivoForm.reset();
      this.selectedFile = null;
    }
  }
}
