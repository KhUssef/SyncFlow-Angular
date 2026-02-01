import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';

interface Company {
  id: string;
  code: string;
}

interface User {
  id: string;
  username: string;
  role: 'manager' | 'user';
  company: Company;
}
interface tokens {
  access_token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  private readonly http = inject(HttpClient);
  readonly user$ = this.userSubject.asObservable();

  private readonly isManagerSubject = new BehaviorSubject<boolean>(false);
  readonly isManager$ = this.isManagerSubject.asObservable();
  
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();
  
  private readonly loggedIn = signal(false);
  private readonly router = inject(Router);

  constructor() {
    // Hydrate auth state when the app bootstraps
    this.checkauthstatus();
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getIsManager(): boolean {
    return this.isManagerSubject.value;
  }

  getUserSnapshot(): User | null {
    return this.userSubject.value;
  }

  login(username: string, password: string, companyCode: string): Observable<boolean> {
    console.log('Attempting login for', username, 'at company', companyCode);
    return this.http.post<tokens>('http://localhost:3000/auth/login', {
      username,
      password,
      companyCode
    }).pipe(
      map((response:tokens) => {
        console.log('Login successful, tokens received');
        localStorage.setItem('accessToken', response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);
        
        this.refreshUser().subscribe();
        
        this.router.navigate(['/dashboard']);
        this.loggedIn.set(true);
        return true;
      }),
      catchError((error) => {
        console.log('Login failed, tokens not received');
        console.log('Error details:', error);
        const errorMessage = error?.error?.message || 'Login failed. Please try again.';
        this.errorSubject.next(errorMessage);
        return of(false);
      })
    );
  }
  private refreshUser(): Observable<User | null> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.userSubject.next(null);
      this.isManagerSubject.next(false);
      this.loggedIn.set(false);
      return of(null);
    }

    return this.http.get<User>('http://localhost:3000/users/current').pipe(
      tap((user) => {
        this.userSubject.next(user);
        this.isManagerSubject.next(user.role === 'manager');
        this.loggedIn.set(true);
      }),
      catchError((err) => {
        console.error('Failed to refresh user', err);
        this.logout();
        return of(null);
      })
    );
  }
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.loggedIn.set(false);
    this.isManagerSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }
  isAuthenticated(): boolean {
    return this.loggedIn();
  }

  refreshToken(): Observable<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      this.logout();
      return of(false);
    }

    return this.http.post<tokens>('http://localhost:3000/auth/refresh', {
      refreshToken
    }).pipe(
      map((response: tokens) => {
        localStorage.setItem('accessToken', response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);
        this.updateAuthStatus(true);
        this.refreshUser().subscribe();
        return true;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  updateAuthStatus(isLoggedIn: boolean): void {
    this.loggedIn.set(isLoggedIn);
    this.isManagerSubject.next(isLoggedIn && this.getCurrentUser()?.role === 'manager' || false);
  }

  isAuthenticatedSignal() {
    return this.loggedIn;
  }

  checkauthstatus() {
    const token = localStorage.getItem('accessToken');
    if(token){
      this.loggedIn.set(true);
      this.isManagerSubject.next(this.getCurrentUser()?.role === 'manager' || false);
      this.refreshUser().subscribe();
    } else {
      this.loggedIn.set(false);
      this.isManagerSubject.next(false);
    }
  }
}
