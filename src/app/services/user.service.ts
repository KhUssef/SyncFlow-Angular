import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserInput, UpdateUserInput } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/users';

  constructor() {}

  /**
   * Get all active users for the current company
   */
  getCompanyUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/company`);
  }

  /**
   * Fetch usernames/id from backend
   */
  getUsernames(): Observable<Array<{id: number, username: string}>> {
    return this.http.get<Array<{id: number, username: string}>>(`${this.baseUrl}/usernames`);
  }

  /**
   * Get all deleted users
   */
  getDeletedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/deleted`);
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new user
   */
  createUser(input: CreateUserInput): Observable<User> {
    return this.http.post<User>("http://localhost:3000/auth/create-user", input);
  }

  /**
   * Update an existing user
   */
  updateUser(id: number, input: UpdateUserInput): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, input);
  }

  /**
   * Delete a user (soft delete)
   */
  deleteUser(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Recover a deleted user
   */
  recoverUser(id: number): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/recover/${id}`, {});
  }

  /**
   * Stream user events (SSE). Token added automatically by interceptor.
   */
  connectToEvents(): EventSource {
    return new EventSource(`${this.baseUrl}/events`);
  }


  getCompanyCode(): Observable<{ companyCode: string }> {
    return this.http.get<{ companyCode: string }>(`http://localhost:3000/auth/company-code`);
  }
}
