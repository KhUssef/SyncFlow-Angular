import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

interface Company {
  id: string;
  code: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'manager' | 'employee';
  company: Company;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>({
    id: '1',
    username: 'John Doe',
    email: 'john@example.com',
    role: 'manager',
    company: { id: '1', code: 'ACME' }
  });
  public user$ = this.userSubject.asObservable();

  private isManagerSubject = new BehaviorSubject<boolean>(true);
  public isManager$ = this.isManagerSubject.asObservable();

  constructor(private router: Router) {}

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getIsManager(): boolean {
    return this.isManagerSubject.value;
  }

  logout(): void {
    this.router.navigate(['/']);
  }
}
