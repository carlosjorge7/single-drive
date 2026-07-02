import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { enviroment } from '../../../enviroments';
import { TokenService } from './token.service';
import { User, AuthTokens } from './models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = enviroment.apiUrl;

  currentUser = signal<User | null>(null);
  isLoading = signal(false);

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router,
  ) {}

  login(username: string, password: string, rememberMe = false) {
    this.isLoading.set(true);
    return this.http.post<AuthTokens>(`${this.api}/auth/login/`, { username, password }).pipe(
      tap((res) => {
        this.tokenService.setTokens(res.access, res.refresh, rememberMe);
        if (rememberMe) {
          this.tokenService.saveUsername(username);
        } else {
          this.tokenService.clearSavedUsername();
        }
        this.currentUser.set(res.user);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return throwError(() => err);
      }),
    );
  }

  logout(): void {
    const refresh = this.tokenService.getRefresh();
    if (refresh) {
      this.http.post(`${this.api}/auth/logout/`, { refresh }).subscribe();
    }
    this.tokenService.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshToken() {
    const refresh = this.tokenService.getRefresh();
    if (!refresh) return throwError(() => new Error('No refresh token'));
    return this.http
      .post<{ access: string }>(`${this.api}/auth/refresh/`, { refresh })
      .pipe(tap((res) => this.tokenService.setTokens(res.access, refresh)));
  }

  loadCurrentUser() {
    return this.http.get<User>(`${this.api}/auth/me/`).pipe(
      tap((user) => this.currentUser.set(user)),
    );
  }

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }
}
