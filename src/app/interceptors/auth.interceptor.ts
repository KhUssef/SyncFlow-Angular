import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // BEFORE: Add authorization header if a token exists
    const token = localStorage.getItem('accessToken');
    if (token) {
      request = request.clone({ setHeaders: {
        Authorization: `Bearer ${token}`
      } });
    }


    return next.handle(request).pipe(
      tap((event: HttpEvent<unknown>) => {
      }),
      catchError((error) => {
        console.error('Request failed:', error);
        return throwError(() => error);
      })
    );
  }
}

export const AuthInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
};
