import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-public',
  standalone: true,
  imports: [CardModule, ButtonModule],
  templateUrl: './public.component.html',
  styleUrl: './public.component.scss',
})
export class PublicComponent {
  private readonly router = inject(Router);

  navigateToAdmin() {
    this.router.navigate(['/private']);
  }
}
