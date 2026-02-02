import { inject, Injectable, signal, Signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { Task, CreateTaskInput } from '../models/task.model';
import { ChartData, DashboardData, Stats } from '../models/stats.model';
// import { UpdateTaskDto } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/tasks';
  private todaysTasks: Task[] = []; 

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

  getDashboardData(params?: { offset?: number; limit?: number }): Observable<DashboardData> {
    return this.getPaginatedTasks(params).pipe(
      map((res) => (Array.isArray(res) ? res : res?.items ?? [])),
      map((tasks: Task[]) => {
        const chartData = this.buildWeeklyChartData(tasks);
        const stats = this.buildStats(tasks);
        const todayTasks = this.filterTodayTasks(tasks);
        return { tasks, chartData, stats, todayTasks };
      })
    );
  }

  getTasksByMonth(year: number, month: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/byMonth/${year}/${month}`);
  }

  getTasksByDay(date: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/by-day/${date}`);
  }

  createTask(input: CreateTaskInput): Observable<Task> {
    console.log(input)
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

  private filterTodayTasks(tasks: Task[]): Task[] {
    const today = this.startOfLocalDay(new Date());
    return tasks.filter((t) => t.dueDate && this.isSameLocalDay(new Date(t.dueDate), today));
  }

  private buildWeeklyChartData(tasks: Task[]): ChartData[] {
    const today = this.startOfLocalDay(new Date());
    return [...Array(7)].map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + (i - 3));
      const dateStr = this.localDateKey(date);
      const dayTasks = tasks.filter((task) => task.dueDate && this.localDateKey(new Date(task.dueDate)) === dateStr);
      const completedTasks = dayTasks.filter((t) => t.completed);
      return {
        date: dateStr,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasksCompleted: completedTasks.length,
        totalTasks: dayTasks.length,
        isToday: dateStr === this.localDateKey(today)
      };
    });
  }

  private buildStats(tasks: Task[]): Stats {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      completionRate: rate
    };
  }

  private startOfLocalDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private localDateKey(date: Date): string {
    return this.startOfLocalDay(date).toLocaleDateString('sv-SE');
  }

  private isSameLocalDay(a: Date, b: Date): boolean {
    return this.localDateKey(a) === this.localDateKey(b);
  }

}