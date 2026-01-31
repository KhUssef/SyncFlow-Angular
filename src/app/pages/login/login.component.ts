import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { bufferTime, takeUntil, timeout } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      companyCode: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.error$.pipe(takeUntil(this.destroy$)).subscribe((error) => {
      this.errorMessage = error || '';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { companyCode, username, password } = this.loginForm.value;
    this.authService.login(username, password, companyCode)
      .pipe(takeUntil(this.destroy$),
        timeout(1000)) // Timeout after 10 seconds
      .subscribe({
        next: (success) => {
          this.isLoading = false;
          if (!success) {
            // Error is handled by the error$ observable
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'An unexpected error occurred';
          console.error('Login error:', error);
        }
      });
  }
  navigateToSignup(): void {
    // Navigate to the signup page
    this.router.navigate(['/signup']);
  }
}
