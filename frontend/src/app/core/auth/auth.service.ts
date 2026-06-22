import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  department?: string;
  role: string;
  supplierId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<AuthUser | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem('token'));

  user = this._user.asReadonly();
  token = this._token.asReadonly();
  isLoggedIn = computed(() => !!this._token());
  isSupplier = computed(() => ['SupplierAdmin', 'SupplierUser'].includes(this._user()?.role ?? ''));
  isAdmin = computed(() => this._user()?.role === 'Admin');
  isApprover = computed(() => ['Admin', 'Approver'].includes(this._user()?.role ?? ''));
  isFinance = computed(() => ['Admin', 'Finance'].includes(this._user()?.role ?? ''));

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: AuthUser }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this._token.set(res.token);
        this._user.set(res.user);
      }));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private loadUser(): AuthUser | null {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }
}
