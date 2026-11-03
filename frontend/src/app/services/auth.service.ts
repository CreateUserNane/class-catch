import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { AuthResponse } from '../models/auth-response';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api';
  private readonly tokenKey = 'classcatch_token';
  private readonly userKey = 'classcatch_user';

  user = signal<User | null>(null);

  constructor(private readonly http: HttpClient) {
    this.restoreSession();
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: 'teacher' | 'student';
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
    );
  }

  getUser(): Observable<User> {
    const token = localStorage.getItem(this.tokenKey);
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    return this.http.get<User>(`${this.apiUrl}/user`, { headers }).pipe(
      tap((user) => this.user.set(user)),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.user.set(null);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.user.set(response.user);
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      return;
    }

    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      try {
        this.user.set(JSON.parse(storedUser));
      } catch {
        this.clearSession();
      }
    }
  }
}
