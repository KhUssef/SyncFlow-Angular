// dashboard.component.ts
import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AddTaskModalComponent } from './add-task-modal/add-task-modal.component';
import { Task } from '../../models/task.model';
import { Event } from '../../models/event.model';
import { Stats, ChartData } from '../../models/stats.model';
import { TaskService } from '../../services/task.service';
import { EventService } from '../../services/event.service';
import { UserService } from '../../services/user.service';
import { CalendarPageComponent } from "../calendar/calendar-page.component";
import { ChartComponent } from "../../components/chart/chart.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AddTaskModalComponent, ChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class DashboardComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private eventSource?: EventSource;
  private taskService = inject(TaskService);
  private eventService = inject(EventService);
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

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.token = localStorage.getItem('accessToken');

    this.fetchTasks();
    this.fetchEvents();
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
    this.error.set(null);
    const sub = this.taskService.getDashboardData({ offset: 0, limit: 100 }).subscribe({
      next: ({ chartData, stats, todayTasks }) => {
        this.chartData.set([...chartData]);
        this.stats.set(stats);
        this.todayTasks.set(todayTasks);
        this.lastRefresh = new Date();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load tasks');
        this.loading.set(false);
        console.error(err);
      }
    });
    this.subscriptions.add(sub);
  }

  fetchEvents(): void {
    const sub = this.eventService.getEventsByDay(new Date()).subscribe({
      next: (events) => {
        this.todayEvents.set(events);
      },
      error: (err) => {
        console.error('Failed to load events', err);
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

  openAddTaskModal(): void {
    this.isAddTaskModalOpen.set(true);
  }

  closeAddTaskModal(): void {
    this.isAddTaskModalOpen.set(false);
  }

  handleCreateTask(taskData: Task): void {
    console.log(taskData)
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
    return event.createdBy?.id === this.user?.id;
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}