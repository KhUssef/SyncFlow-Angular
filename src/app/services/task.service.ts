import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Task, CreateTaskInput } from '../models/task.model';
// import { UpdateTaskDto } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/tasks';

  /** Server-Sent Events stream for task updates (token passed as query param). */
  connectToEvents(token: string): EventSource {
    const url = `${this.baseUrl}/events?token=${encodeURIComponent(token)}`;
    return new EventSource(url);
  }

  getTodayTasks(): Observable<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getTasksByDay(today);
  }

  getTasksByUser(userId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/user/${userId}`).pipe(shareReplay(1));
  }

  getPaginatedTasks(params?: { offset?: number; limit?: number}): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.offset) httpParams = httpParams.set('offset', params.offset);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<any>(`${this.baseUrl}/paginated`, { params: httpParams });
  }

  getTasksByMonth(year: number, month: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/byMonth/${year}/${month}`);
  }

  getTasksByDay(date: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/by-day/${date}`);
  }

  createTask(input: CreateTaskInput): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, input);
  }

  updateTask(id: number, update: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, update);
  }

  deleteTask(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }

  markAsDone(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/done/${id}`, {});
  }

}