import { Injectable } from '@angular/core';

const ACCESS_KEY = 'hd_access';
const REFRESH_KEY = 'hd_refresh';
const REMEMBER_USER_KEY = 'hd_remember_user';

@Injectable({ providedIn: 'root' })
export class TokenService {

  // ─── Token read (checks localStorage first, then sessionStorage) ──────────

  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY);
  }

  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
  }

  // ─── Token write ──────────────────────────────────────────────────────────

  setTokens(access: string, refresh: string, remember = false): void {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(ACCESS_KEY, access);
    store.setItem(REFRESH_KEY, refresh);
    // Clean the other store to avoid stale tokens
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(ACCESS_KEY);
    other.removeItem(REFRESH_KEY);
  }

  // ─── Remembered username ──────────────────────────────────────────────────

  getSavedUsername(): string | null {
    return localStorage.getItem(REMEMBER_USER_KEY);
  }

  saveUsername(username: string): void {
    localStorage.setItem(REMEMBER_USER_KEY, username);
  }

  clearSavedUsername(): void {
    localStorage.removeItem(REMEMBER_USER_KEY);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  clearTokens(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getAccess();
  }
}
