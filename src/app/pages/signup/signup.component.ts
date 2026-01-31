import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { CompanyService } from '../../services/company.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
  changeDetection: ChangeDetectionStrategy.Default
})
export class SignupComponent {
  signupForm: FormGroup;
  showSuccessMessage = signal(false);
  showErrorMessage = signal(false);
  successMessage = signal('');
  ErrorMessage = signal('');
  isSubmitting = signal(false);
  formValid = signal(false);
  
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private companyCode = signal<string>('');
  private companyService = inject(CompanyService);
  private authService = inject(AuthService);

  constructor() {
    this.signupForm = this.fb.group({
      companyName: ['', [Validators.required],  [this.companyNameValidator.bind(this)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Track form validity changes and update signal
    this.signupForm.statusChanges.subscribe(() => {
      this.formValid.set(this.signupForm.valid);
      console.log('Form validity updated:', this.signupForm.valid);
    });

    // Set initial validity
    this.formValid.set(this.signupForm.valid);
  }

  companyNameValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value) {
      return of(null);
    }

    return timer(500).pipe(
      take(1),
      switchMap(() => 
        this.http.get<any>(`http://localhost:3000/company/${control.value}`).pipe(
          map((response) => {
            console.log('Company validation response:', response);
            const exists = typeof response === 'boolean' ? response : !!response;
            return exists ? { companyExists: true } : null;
          }),
          catchError((error) => {
            console.log('Company validation error:', error.status);
            if (error.status === 404) {
              return of(null); 
            }
            return of({ serverError: true });
          })
        )
      )
    );
  }

  onSignup() {
    if (this.signupForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      const { companyName, username, password } = this.signupForm.value;
      
      this.companyService.createCompany(companyName, username, password).subscribe({
        next: (response) => {
          this.companyCode.set(response.code);
          this.displaySuccessMessage(username, response.code);
          
          // Reset form after 2 seconds
          setTimeout(async () => {
            this.authService.login(username, password, response.code).subscribe((value: any) => {
              if(value){
                this.router.navigate(['/dashboard']);
              }
            });
            this.router.navigate(['/dashboard']);
          }, 1000);
        },
        error: (error) => {
          this.displayErrorMessage('Error creating company. Please try again.');
          console.error('Signup error:', error);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  displaySuccessMessage(username: string, companyCode: string) {
    this.successMessage.set(
      `Company created successfully! Your company code is: ${companyCode}. Use username "${username}" to log in.`
    );
    this.showSuccessMessage.set(true);
  }

  displayErrorMessage(message: string) {
    this.ErrorMessage.set(message);
    this.showErrorMessage.set(true);
  }

  renavigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  get companyName() {
    return this.signupForm.get('companyName');
  }

  get username() {
    return this.signupForm.get('username');
  }

  get password() {
    return this.signupForm.get('password');
  }
}