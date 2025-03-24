import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Pelis } from './models/Pelis';
import { PelisService } from './services/pelis.service';
import { first } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-pelis',
  templateUrl: './pelis.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CardModule, ButtonModule, DialogModule],
  styleUrls: ['./pelis.component.scss'],
})
export class PelisComponent implements OnInit {
  pelis: Pelis[] = [];
  peliForm: FormGroup;
  displayModal: boolean = false;

  constructor(private pelisService: PelisService, private fb: FormBuilder) {
    this.peliForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(255)]],
    });
  }

  ngOnInit(): void {
    this.loadPelis();
  }

  loadPelis(): void {
    this.pelisService
      .getAll()
      .pipe(first())
      .subscribe((data) => {
        this.pelis = data;
      });
  }

  onSubmit(): void {
    if (this.peliForm.valid) {
      const newPeli: Pelis = this.peliForm.value;
      this.pelisService.create(newPeli).subscribe((createdPeli) => {
        this.pelis.push(createdPeli);
        this.hideModal();
        this.peliForm.reset();
      });
    }
  }

  showModal(): void {
    this.displayModal = true;
  }

  hideModal(): void {
    this.displayModal = false;
  }

  deleteFilm(id: string): void {
    this.pelisService
      .delete(id)
      .pipe(first())
      .subscribe(() => this.loadPelis());
  }
}
