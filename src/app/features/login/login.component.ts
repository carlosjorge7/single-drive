import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../core/auth/auth.service';
import { TokenService } from '../../core/auth/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  form: FormGroup;
  error = signal('');
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router,
  ) {
    const savedUsername = this.tokenService.getSavedUsername();
    this.form = this.fb.group({
      username: [savedUsername ?? '', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [!!savedUsername],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.error.set('');
    this.loading.set(true);

    const { username, password, rememberMe } = this.form.value;
    this.authService.login(username, password, rememberMe).subscribe({
      next: () => this.router.navigate(['/drive']),
      error: (err) => {
        const msg =
          err?.error?.detail ||
          err?.error?.non_field_errors?.[0] ||
          'Error al iniciar sesión. Revisa tus credenciales.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }
}
