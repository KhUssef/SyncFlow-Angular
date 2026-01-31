import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Event, CreateEventInput, UpdateEventInput } from '../models/event.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
    private http = inject(HttpClient);

    createCompany(companyName: string, managerUsername: string, managerPassword: string): Observable<any> {
      return this.http.post('http://localhost:3000/company/create-company', {
        companyName,
        managerUsername,
        managerPassword
      });
    }

}