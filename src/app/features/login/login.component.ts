import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../core/auth/auth.service';
import { TokenService } from '../../core/auth/token.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('passwordConfirm')?.value;
  if (confirm && pw !== confirm) return { passwordsMismatch: true };
  return null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, CheckboxModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  mode = signal<'login' | 'register'>('login');
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
    this.form = this.buildForm(savedUsername);
  }

  private buildForm(savedUsername?: string | null): FormGroup {
    return this.fb.group({
      username: [savedUsername ?? '', [Validators.required, Validators.minLength(3)]],
      email: [''],
      password: ['', [Validators.required, Validators.minLength(4)]],
      passwordConfirm: [''],
      rememberMe: [!!savedUsername],
    }, { validators: passwordsMatch });
  }

  switchMode(m: 'login' | 'register') {
    this.mode.set(m);
    this.error.set('');
    const savedUsername = this.tokenService.getSavedUsername();
    this.form = this.buildForm(savedUsername);
    if (m === 'register') {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('passwordConfirm')?.setValidators([Validators.required]);
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('passwordConfirm')?.updateValueAndValidity();
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.error.set('');
    this.loading.set(true);

    if (this.mode() === 'login') {
      const { username, password, rememberMe } = this.form.value;
      this.authService.login(username, password, rememberMe).subscribe({
        next: () => this.router.navigate(['/drive']),
        error: (err) => {
          this.error.set(
            err?.error?.non_field_errors?.[0] ||
            err?.error?.detail ||
            'Credenciales incorrectas.'
          );
          this.loading.set(false);
        },
      });
    } else {
      const { username, email, password, passwordConfirm } = this.form.value;
      this.authService.register(username, email, password, passwordConfirm).subscribe({
        next: () => this.router.navigate(['/drive']),
        error: (err) => {
          const data = err?.error ?? {};
          this.error.set(
            data.username?.[0] ||
            data.password?.[0] ||
            data.password_confirm?.[0] ||
            data.non_field_errors?.[0] ||
            data.detail ||
            'Error al crear la cuenta.'
          );
          this.loading.set(false);
        },
      });
    }
  }
}
