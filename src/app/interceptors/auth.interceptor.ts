import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private isRefreshing = false;
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // BEFORE: Add authorization header if authenticated
    if (this.authService.isAuthenticated()) {
      const token = localStorage.getItem('accessToken') ?? ''
      request = request.clone({ setHeaders: {
        'Authorization': `Bearer ${token}`
      } });
    }

    console.log('Request sent:', request.url);

    // AFTER: Handle response
    return next.handle(request).pipe(
      tap((event: HttpEvent<unknown>) => {
        console.log('Response received:', event);
      }),
      catchError((error) => {
        console.error('Request failed:', error);
        
        // Handle 401 Unauthorized - try to refresh token (only once)
        if (error.status === 401 && !this.isRefreshing) {
          this.isRefreshing = true;
          
          return this.authService.refreshToken().pipe(
            switchMap((success: boolean) => {
              this.isRefreshing = false;
              
              if (success) {
                // Retry the original request with new token
                const token = localStorage.getItem('accessToken') ?? '';
                const retryRequest = request.clone({ setHeaders: {
                  'Authorization': `Bearer ${token}`
                } });
                return next.handle(retryRequest);
              } else {
                // Refresh failed, logout
                return throwError(() => error);
              }
            }),
            catchError(() => {
              this.isRefreshing = false;
              this.authService.logout();
              return throwError(() => error);
            })
          );
        }
        
        throw error;
      })
    );
  }
}

export const AuthInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
};
