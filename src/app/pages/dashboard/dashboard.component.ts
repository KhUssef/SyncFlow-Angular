// dashboard.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, map, tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AddTaskModalComponent } from './add-task-modal/add-task-modal.component';
import { Task } from '../../models/task.model';
import { Event } from '../../models/event.model';
import { User } from '../../models/user.model';
import { Stats, ChartData, ChartSeries } from '../../models/stats.model';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, AddTaskModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private eventSource?: EventSource;
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  
  loading = signal(false);
  error = signal<string | null>(null);

  stats = signal<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  });
  
  chartData = signal<ChartData[]>([]);
  todayTasks = signal<Task[]>([]);
  todayEvents = signal<Event[]>([]);
  users = signal<Array<{id: number, username: string}>>([]);
  
  isAddTaskModalOpen = signal(false);
  createTaskLoading = signal(false);
  usersLoading = signal(false);
  
  currentDate: Date = new Date();
  lastRefresh: Date = new Date();
  
  user: any;
  token: string | null = null;
  notifications = signal<string[]>([]);

  // Chart options for ngx-charts
  chartOptions: any = {
    view: [1000, 300],
    showXAxis: true,
    showYAxis: true,
    gradient: false,
    showLegend: true,
    showXAxisLabel: true,
    xAxisLabel: 'Date',
    showYAxisLabel: true,
    yAxisLabel: 'Tasks',
    timeline: false,
    colorScheme: {
      domain: ['#4CAF50', '#2196F3']
    }
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.token = localStorage.getItem('accessToken');

    this.fetchTasks();
    this.fetchUsernames();
    this.setupSse();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  fetchTasks(): void {
    this.loading.set(true);
    const sub = this.taskService
      .getPaginatedTasks({ offset: 0, limit: 100 })
      .pipe(
        map((res) => (Array.isArray(res) ? res : res?.items ?? [])),
        tap((tasks) => {
          this.processTaskData(tasks);
          const today = this.startOfLocalDay(new Date());
          // Use local-day comparison to avoid UTC shifting tasks to the wrong day
          this.todayTasks.set(
            tasks.filter((t: Task) => {
              if (!t.dueDate) return false;
              return this.isSameLocalDay(new Date(t.dueDate), today);
            })
          );
          this.lastRefresh = new Date();
          this.loading.set(false);
        })
      )
      .subscribe({
        error: (err) => {
          this.error.set('Failed to load tasks');
          this.loading.set(false);
          console.error(err);
        }
      });
    this.subscriptions.add(sub);
  }

  fetchUsernames(): void {
    this.usersLoading.set(true);
    const sub = this.userService.getUsernames().subscribe({
      next: (users) => {
        this.users.set(users);
        this.usersLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.usersLoading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  setupSse(): void {
    if (!this.token) return;
    this.eventSource = this.taskService.connectToEvents(this.token);

    this.eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.data?.message) {
          this.notifications.update((list) => [payload.data.message, ...list]);
        }
      } catch (e) {
        console.warn('Failed to parse SSE message', e);
      }
    };

    this.eventSource.onerror = () => {
      console.warn('SSE connection lost');
    };
  }

  processTaskData(tasks: Task[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weeklyData: ChartData[] = [...Array(7)].map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + (i - 3));
      const dateStr = this.localDateKey(date);
      
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        return this.localDateKey(new Date(task.dueDate)) === dateStr;
      });
      
      const completedTasks = dayTasks.filter(t => t.completed);
      
      return {
        date: dateStr,
        displayDate: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        tasksCompleted: completedTasks.length,
        totalTasks: dayTasks.length,
        isToday: dateStr === today.toISOString().split('T')[0]
      };
    });
    
    this.chartData.set(weeklyData);
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    this.stats.set({
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      completionRate: rate
    });
  }

  /**
   * Transform chart data for ngx-charts line chart
   */
  getChartSeriesData(): ChartSeries[] {
    return [
      {
        name: 'Tasks Completed',
        series: this.chartData().map((d: ChartData) => ({
          name: d.displayDate,
          value: d.tasksCompleted
        }))
      }
    ];
  }

  openAddTaskModal(): void {
    this.isAddTaskModalOpen.set(true);
  }

  closeAddTaskModal(): void {
    this.isAddTaskModalOpen.set(false);
  }

  handleCreateTask(taskData: any): void {
    this.createTaskLoading.set(true);
    this.taskService.createTask(taskData).subscribe({
      next: () => {
        this.createTaskLoading.set(false);
        this.closeAddTaskModal();
        this.fetchTasks();
      },
      error: (err) => {
        this.createTaskLoading.set(false);
        console.error('Failed to create task', err);
      }
    });
  }

  isTaskAssignedToMe(task: Task): boolean {
    return task.assignedTo?.id === this.user?.id;
  }

  isEventCreatedByMe(event: Event): boolean {
    return event.createdBy === this.user?.id;
  }

  private startOfLocalDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private localDateKey(date: Date): string {
    // Stable yyyy-mm-dd in local time to avoid UTC off-by-one issues
    return this.startOfLocalDay(date).toLocaleDateString('sv-SE');
  }

  private isSameLocalDay(a: Date, b: Date): boolean {
    return this.localDateKey(a) === this.localDateKey(b);
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}