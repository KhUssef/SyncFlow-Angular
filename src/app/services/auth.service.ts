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
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User |null>(null);
  private http = inject(HttpClient);
  public user$ = this.userSubject.asObservable();

  private isManagerSubject = new BehaviorSubject<boolean>(false);
  public isManager$ = this.isManagerSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();
  
  private loggedIn = signal(false);
  private router = inject(Router);

  constructor() {}

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getIsManager(): boolean {
    return this.isManagerSubject.value;
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
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
        this.getUserInfo();
        
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
  private getUserInfo(): void {
    this.http.get<User>('/api/current-user').subscribe((user: User) => {
      this.userSubject.next(user);
      this.isManagerSubject.next(user.role === 'manager');
    });
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
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.updateAuthStatus(true);
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
      this.getUserInfo();
    } else {
      this.loggedIn.set(false);
      this.isManagerSubject.next(false);
    }
  }
}
